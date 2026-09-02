import type { ZodError } from "zod";

import { logger } from "@/lib/logger";

import {
	type AttributeContext,
	type Condition,
	type EvaluationResult,
	type Policy,
	parsedPolicies,
	policySchema,
} from "./types";

// Performance optimization: LRU Cache implementation
class LRUCache<K, V> {
	private cache = new Map<K, V>();
	private maxSize: number;

	constructor(maxSize: number = 10000) {
		this.maxSize = maxSize;
	}

	get(key: K): V | undefined {
		const value = this.cache.get(key);
		if (value !== undefined) {
			// Move to end (most recently used)
			this.cache.delete(key);
			this.cache.set(key, value);
		}
		return value;
	}

	set(key: K, value: V): void {
		if (this.cache.has(key)) {
			this.cache.delete(key);
		} else if (this.cache.size >= this.maxSize) {
			// Remove least recently used (first entry)
			const firstKey = this.cache.keys().next().value;
			if (firstKey !== undefined) {
				this.cache.delete(firstKey);
			}
		}
		this.cache.set(key, value);
	}

	clear(): void {
		this.cache.clear();
	}

	get size(): number {
		return this.cache.size;
	}
}

// Performance optimization: Pre-compiled attribute path resolver
type CompiledPath = {
	scope: string;
	keys: string[];
	resolver: (context: AttributeContext) => unknown;
};

// Performance metrics (optional, for monitoring)
type PerformanceMetrics = {
	evaluations: number;
	cacheHits: number;
	cacheMisses: number;
	averageEvaluationTime: number;
	totalEvaluationTime: number;
};

// Enhanced Policy Engine with OPA-level performance optimizations
export class PolicyEngine {
	// Core caches
	private static policyCache = new Map<string, Policy[]>();
	private static conditionCache = new LRUCache<string, boolean>(50000);
	private static compiledPathsCache = new Map<string, CompiledPath>();
	private static conditionMemoCache = new LRUCache<string, boolean>(10000);

	// Performance indexes for fast lookups
	private static roleIndex = new Map<string, Set<string>>(); // role -> Set<policyId>
	private static resourceActionIndex = new Map<string, Policy[]>(); // "resource:action" -> policies

	// Configuration
	private static debugMode = false;
	private static enableMetrics = false;
	private static metrics: PerformanceMetrics = {
		evaluations: 0,
		cacheHits: 0,
		cacheMisses: 0,
		averageEvaluationTime: 0,
		totalEvaluationTime: 0,
	};

	// Pre-computed fast paths
	private static readonly FAST_PATH_OPERATORS = new Set([
		"equals",
		"notequals",
		"exists",
	]);

	static initialize(debug = false, enableMetrics = false) {
		this.debugMode = debug;
		this.enableMetrics = enableMetrics;
		this.buildIndexes(parsedPolicies);
		if (this.debugMode) {
			logger.info("PolicyEngine initialized with optimized indexes");
		}
	}

	private static buildIndexes(policies: Policy[]) {
		// Reset indexes
		this.roleIndex.clear();
		this.resourceActionIndex.clear();

		// Pre-sort policies by priority once
		const sortedPolicies = [...policies].sort(
			(a, b) => b.priority - a.priority
		);

		for (const policy of sortedPolicies) {
			// Build resource:action index
			for (const resource of policy.target.resources) {
				for (const action of policy.target.actions) {
					const key = `${resource}:${action}`;
					const existing = this.resourceActionIndex.get(key) || [];
					existing.push(policy);
					this.resourceActionIndex.set(key, existing);
				}
			}

			// Build role index for fast target matching
			if (policy.target.roles && policy.target.roles.length > 0) {
				for (const role of policy.target.roles) {
					if (!this.roleIndex.has(role)) {
						this.roleIndex.set(role, new Set());
					}
					this.roleIndex.get(role)!.add(policy.id);
				}
			}
		}

		// Legacy cache for backwards compatibility
		this.policyCache = this.resourceActionIndex;
	}

	static evaluate(context: AttributeContext): boolean {
		const result = this.evaluateAll(context);
		return result.allowed;
	}

	// Batch evaluation for multiple contexts (OPA-style)
	static evaluateBatch(contexts: AttributeContext[]): EvaluationResult[] {
		const startTime = this.enableMetrics ? performance.now() : 0;
		const results: EvaluationResult[] = [];

		for (const context of contexts) {
			results.push(this.evaluateAll(context));
		}

		if (this.enableMetrics) {
			const duration = performance.now() - startTime;
			this.updateMetrics(results.length, 0, 0, duration);
		}

		return results;
	}

	static evaluateAll(context: AttributeContext): EvaluationResult {
		const startTime = this.enableMetrics ? performance.now() : 0;

		if (this.debugMode) {
			logger.debug("Evaluating context:", {
				userId: context.user.id,
				resourceType: context.resource.type,
				action: context.action,
			});
		}

		const matchedPolicies: Array<{
			id: string;
			effect: "allow" | "deny";
			description?: string;
		}> = [];

		try {
			this.validateContext(context);

			// Fast path: Get applicable policies from optimized index
			const applicablePolicies = this.getApplicablePolicies(
				context.resource.type,
				context.action,
				context.user.roles
			);

			if (this.debugMode && applicablePolicies.length > 0) {
				logger.debug(
					"Applicable policies:",
					applicablePolicies.map((p) => p.id)
				);
			}

			let decision: "allow" | "deny" | "none" = "none";
			let deniedBy: string | undefined;
			let allowedBy: string | undefined;

			// Optimized: Early termination on first deny
			for (const policy of applicablePolicies) {
				// Fast target match with role pre-filtering
				if (!this.isTargetMatchFast(policy, context)) continue;

				// Get condition result with memoization
				const conditionResult = this.getConditionResult(policy, context);

				if (conditionResult) {
					matchedPolicies.push({
						id: policy.id,
						effect: policy.effect,
						description: policy.description,
					});

					// Deny wins - immediate return (critical for performance)
					if (policy.effect === "deny") {
						decision = "deny";
						deniedBy = policy.id;
						// Lazy audit logging (defer expensive JSON.stringify)
						this.auditLogLazy(context, decision, policy.id, matchedPolicies);
						return this.createResult(
							false,
							"deny",
							matchedPolicies,
							undefined,
							policy.id,
							startTime
						);
					}

					// First allow sets the decision
					if (decision === "none") {
						decision = "allow";
						allowedBy = policy.id;
					}
				}
			}

			const finalDecision = decision === "allow";
			this.auditLogLazy(context, decision, allowedBy, matchedPolicies);

			return this.createResult(
				finalDecision,
				decision,
				matchedPolicies,
				allowedBy,
				deniedBy,
				startTime
			);
		} catch (error) {
			logger.error("Policy evaluation error:", error);
			this.auditLogLazy(context, "none", undefined, [], error);
			return this.createResult(
				false,
				"none",
				matchedPolicies,
				undefined,
				undefined,
				startTime
			);
		}
	}

	// Optimized: Pre-filter by roles using index
	private static getApplicablePolicies(
		resource: string,
		action: string,
		userRoles: string[]
	): Policy[] {
		const key = `${resource}:${action}`;
		let policies = this.resourceActionIndex.get(key) || [];

		// Fast path: If no role restrictions, return all
		if (policies.length === 0) {
			return [];
		}

		// Optimize: Pre-filter by roles if user has roles
		if (userRoles.length > 0) {
			const rolePolicyIds = new Set<string>();
			for (const role of userRoles) {
				const policyIds = this.roleIndex.get(role);
				if (policyIds) {
					for (const id of policyIds) {
						rolePolicyIds.add(id);
					}
				}
			}

			// Fast path: If no role-based policies match, still check policies without role restrictions
			// Policies without role restrictions apply to all users
			policies = policies.filter((p) => {
				const roleTargets = p.target.roles;
				const hasRoleTarget =
					Array.isArray(roleTargets) && roleTargets.length > 0;
				return !hasRoleTarget || rolePolicyIds.has(p.id);
			});
		}

		return policies;
	}

	// Optimized: Fast target matching with minimal allocations
	private static isTargetMatchFast(
		policy: Policy,
		context: AttributeContext
	): boolean {
		// Fast path: Resource and action already matched by index
		// Only need to check roles if policy has role restrictions
		if (!policy.target.roles || policy.target.roles.length === 0) {
			return true;
		}

		// Fast role matching using Set for O(1) lookup
		const userRoles = new Set(context.user.roles);
		for (const role of policy.target.roles) {
			if (userRoles.has(role)) {
				return true;
			}
		}

		return false;
	}

	// Optimized: Condition evaluation with memoization and caching
	private static getConditionResult(
		policy: Policy,
		context: AttributeContext
	): boolean {
		const cacheKey = this.getConditionCacheKey(policy.id, context);

		// Check LRU cache (caches both hits and misses)
		const cached = this.conditionCache.get(cacheKey);
		if (cached !== undefined) {
			if (this.enableMetrics) {
				this.metrics.cacheHits++;
			}
			return cached;
		}

		if (this.enableMetrics) {
			this.metrics.cacheMisses++;
		}

		// Evaluate conditions with memoization
		const result = this.checkConditionsMemoized(
			policy.conditions,
			context,
			new Map()
		);

		// Cache result (both true and false)
		this.conditionCache.set(cacheKey, result);

		return result;
	}

	// Optimized: Condition checking with memoization for sub-conditions
	private static checkConditionsMemoized(
		condition: Condition,
		context: AttributeContext,
		memo: Map<string, boolean>
	): boolean {
		// Generate memo key for this condition
		const memoKey = this.getConditionMemoKey(condition, context);
		const memoized = memo.get(memoKey);
		if (memoized !== undefined) {
			return memoized;
		}

		let result: boolean;

		switch (condition.type) {
			case "allOf":
				// Short-circuit: Fail fast on first false
				result = condition.conditions.every((c: Condition) =>
					this.checkConditionsMemoized(c, context, memo)
				);
				break;
			case "anyOf":
				// Short-circuit: Succeed fast on first true
				result = condition.conditions.some((c: Condition) =>
					this.checkConditionsMemoized(c, context, memo)
				);
				break;
			case "not":
				result = !this.checkConditionsMemoized(
					condition.condition,
					context,
					memo
				);
				break;
			case "attribute":
				result = this.evaluateConditionFast(
					condition.attribute,
					condition.operator,
					condition.value,
					context
				);
				break;
			default:
				throw new PolicyEvaluationError("Invalid condition structure");
		}

		memo.set(memoKey, result);
		return result;
	}

	// Legacy method for backwards compatibility
	private static checkConditions(
		condition: Condition,
		context: AttributeContext
	): boolean {
		return this.checkConditionsMemoized(condition, context, new Map());
	}

	// Optimized: Fast condition evaluation with compiled paths
	private static evaluateConditionFast(
		attributePath: string,
		operator: string,
		expectedValue: unknown,
		context: AttributeContext
	): boolean {
		// Use compiled path resolver
		const compiled = this.getCompiledPath(attributePath);
		const actualValue = compiled.resolver(context);

		// Fast path for common operators
		return this.applyOperatorFast(operator, actualValue, expectedValue);
	}

	// Legacy method
	private static evaluateCondition(
		attributePath: string,
		operator: string,
		expectedValue: unknown,
		context: AttributeContext
	): boolean {
		return this.evaluateConditionFast(
			attributePath,
			operator,
			expectedValue,
			context
		);
	}

	// Performance: Compile and cache attribute path resolvers
	private static getCompiledPath(path: string): CompiledPath {
		const cached = this.compiledPathsCache.get(path);
		if (cached) {
			return cached;
		}

		const parts = path.split(".");
		if (parts.length === 0) {
			throw new PolicyEvaluationError(`Invalid attribute path: ${path}`);
		}

		const scope = parts[0]!;
		const keys = parts.slice(1);
		const resolver = this.createPathResolver(scope, keys);
		const compiled: CompiledPath = { scope, keys, resolver };
		this.compiledPathsCache.set(path, compiled);
		return compiled;
	}

	// Optimized: Create path resolver function (no string operations at runtime)
	private static createPathResolver(
		scope: string,
		keys: string[]
	): (context: AttributeContext) => unknown {
		// Pre-compile resolver function for maximum performance
		switch (scope) {
			case "user":
				return (ctx) => {
					let obj: unknown = ctx.user;
					for (const key of keys) {
						obj = (obj as Record<string, unknown>)?.[key];
						if (obj === undefined) return undefined;
					}
					return obj;
				};
			case "resource":
				return (ctx) => {
					let obj: unknown = ctx.resource;
					for (const key of keys) {
						obj = (obj as Record<string, unknown>)?.[key];
						if (obj === undefined) return undefined;
					}
					return obj;
				};
			case "environment":
				return (ctx) => {
					let obj: unknown = ctx.environment;
					for (const key of keys) {
						obj = (obj as Record<string, unknown>)?.[key];
						if (obj === undefined) return undefined;
					}
					return obj;
				};
			case "patient":
				return (ctx) => {
					if (!ctx.patient) {
						throw new PolicyEvaluationError(
							"Patient scope not available in context. Ensure patient data is included in AttributeContext."
						);
					}
					let obj: unknown = ctx.patient;
					for (const key of keys) {
						obj = (obj as Record<string, unknown>)?.[key];
						if (obj === undefined) return undefined;
					}
					return obj;
				};
			case "encounter":
				return (ctx) => {
					if (!ctx.encounter) {
						throw new PolicyEvaluationError(
							"Encounter scope not available in context. Ensure encounter data is included in AttributeContext."
						);
					}
					let obj: unknown = ctx.encounter;
					for (const key of keys) {
						obj = (obj as Record<string, unknown>)?.[key];
						if (obj === undefined) return undefined;
					}
					return obj;
				};
			case "organization":
				return (ctx) => {
					if (!ctx.organization) {
						throw new PolicyEvaluationError(
							"Organization scope not available in context. Ensure organization data is included in AttributeContext."
						);
					}
					let obj: unknown = ctx.organization;
					for (const key of keys) {
						obj = (obj as Record<string, unknown>)?.[key];
						if (obj === undefined) return undefined;
					}
					return obj;
				};
			case "consent":
				return (ctx) => {
					if (!ctx.consent) {
						throw new PolicyEvaluationError(
							"Consent scope not available in context. Ensure consent data is included in AttributeContext."
						);
					}
					let obj: unknown = ctx.consent;
					for (const key of keys) {
						obj = (obj as Record<string, unknown>)?.[key];
						if (obj === undefined) return undefined;
					}
					return obj;
				};
			default:
				throw new PolicyEvaluationError(
					`Invalid attribute scope: ${scope}. Valid scopes: user, resource, environment, patient, encounter, organization, consent`
				);
		}
	}

	// Legacy method for backwards compatibility
	private static getAttributeValue(
		path: string,
		context: AttributeContext
	): unknown {
		const compiled = this.getCompiledPath(path);
		return compiled.resolver(context);
	}

	// Optimized: Fast operator evaluation with early returns
	private static applyOperatorFast(
		op: string,
		a: unknown,
		b: unknown
	): boolean {
		const opLower = op.toLowerCase();

		// Fast path for common operators (avoid switch overhead)
		if (opLower === "equals") return a === b;
		if (opLower === "notequals") return a !== b;
		if (opLower === "exists") return a !== undefined && a !== null;

		// Standard operators
		switch (opLower) {
			case "in":
				return Array.isArray(b) && b.includes(a);
			case "notin":
				return Array.isArray(b) && !b.includes(a);
			case "greaterthan":
				return PolicyEngine.compareOrdered(a, b, "gt");
			case "lessthan":
				return PolicyEngine.compareOrdered(a, b, "lt");
			case "contains":
				return typeof a === "string" && a.includes(b as string);
			case "startswith":
				return typeof a === "string" && a.startsWith(b as string);
			case "endswith":
				return typeof a === "string" && a.endsWith(b as string);
			// EHR-critical operators
			case "overlaps":
				if (!Array.isArray(a) || !Array.isArray(b)) return false;
				return a.some((v) => b.includes(v));
			case "within":
				if (!b || typeof b !== "object" || !("start" in b) || !("end" in b)) {
					throw new PolicyEvaluationError(
						"Operator &apos;within&apos; requires object with start and end properties: { start: value, end: value }"
					);
				}
				return (
					(a as number) >= (b as { start: number }).start &&
					(a as number) <= (b as { end: number }).end
				);
			case "between":
				if (Array.isArray(b) && b.length === 2) {
					return PolicyEngine.isBetweenOrdered(a, b[0], b[1]);
				}
				if (typeof b === "object" && b !== null && "start" in b && "end" in b) {
					return (
						(a as number) >= (b as { start: number }).start &&
						(a as number) <= (b as { end: number }).end
					);
				}
				throw new PolicyEvaluationError(
					"Operator &apos;between&apos; requires array [min, max] or object { start, end }"
				);
			default:
				throw new PolicyEvaluationError(`Unsupported operator: ${op}`);
		}
	}

	// Legacy method
	private static isOrderedComparable(value: unknown): value is number | string {
		return typeof value === "number" || typeof value === "string";
	}

	private static compareOrdered(
		a: unknown,
		b: unknown,
		direction: "gt" | "lt"
	): boolean {
		if (
			!PolicyEngine.isOrderedComparable(a) ||
			!PolicyEngine.isOrderedComparable(b)
		) {
			return false;
		}
		return direction === "gt" ? a > b : a < b;
	}

	private static isBetweenOrdered(
		value: unknown,
		min: unknown,
		max: unknown
	): boolean {
		if (
			!PolicyEngine.isOrderedComparable(value) ||
			!PolicyEngine.isOrderedComparable(min) ||
			!PolicyEngine.isOrderedComparable(max)
		) {
			return false;
		}
		return value >= min && value <= max;
	}

	private static applyOperator(op: string, a: unknown, b: unknown): boolean {
		return this.applyOperatorFast(op, a, b);
	}

	private static getCacheKey(resource: string, action: string): string {
		return `${resource}:${action}`;
	}

	// Optimized: Cache key generation (minimal string operations)
	private static getConditionCacheKey(
		policyId: string,
		context: AttributeContext
	): string {
		// Use stable, non-sensitive attributes only
		// Optimized: Single template literal (faster than concatenation)
		const roles = context.user?.roles?.join(",") ?? "";
		const resourceName =
			(context.resource?.attributes?.name as string | undefined) ?? "";
		return `${policyId}:${context.user?.id || ""}:${roles}:${context.resource?.type || ""}:${resourceName}:${context.action || ""}`;
	}

	// Generate memo key for condition memoization
	private static getConditionMemoKey(
		condition: Condition,
		context: AttributeContext
	): string {
		const scope = `${context.user?.id || ""}:${context.user?.roles?.join(",") || ""}:${(context.resource?.attributes?.name as string) || ""}`;
		if (condition.type === "attribute") {
			return `attr:${scope}:${condition.attribute}:${condition.operator}:${JSON.stringify(condition.value)}`;
		}
		return `cond:${scope}:${condition.type}:${JSON.stringify(condition).slice(0, 100)}`;
	}

	private static validateContext(context: AttributeContext): void {
		if (!context.user || !context.resource || !context.action) {
			throw new PolicyEvaluationError(
				"Invalid context: missing required fields"
			);
		}
	}

	// Helper: Create result object (reusable pattern)
	private static createResult(
		allowed: boolean,
		decision: "allow" | "deny" | "none",
		matchedPolicies: Array<{
			id: string;
			effect: "allow" | "deny";
			description?: string;
		}>,
		allowedBy?: string,
		deniedBy?: string,
		startTime?: number
	): EvaluationResult {
		if (this.enableMetrics && startTime !== undefined) {
			const duration = performance.now() - startTime;
			this.updateMetrics(1, 0, 0, duration);
		}

		return {
			allowed,
			decision,
			matchedPolicies,
			allowedBy,
			deniedBy,
		};
	}

	// Performance metrics tracking
	private static updateMetrics(
		evaluations: number,
		hits: number,
		misses: number,
		duration: number
	): void {
		this.metrics.evaluations += evaluations;
		this.metrics.cacheHits += hits;
		this.metrics.cacheMisses += misses;
		this.metrics.totalEvaluationTime += duration;
		this.metrics.averageEvaluationTime =
			this.metrics.totalEvaluationTime / this.metrics.evaluations;
	}

	// Get performance metrics
	static getMetrics(): PerformanceMetrics {
		return { ...this.metrics };
	}

	// Reset performance metrics
	static resetMetrics(): void {
		this.metrics = {
			evaluations: 0,
			cacheHits: 0,
			cacheMisses: 0,
			averageEvaluationTime: 0,
			totalEvaluationTime: 0,
		};
	}

	static clearCache(): void {
		// Do not clear resourceActionIndex — it shares reference with policyCache
		this.conditionCache.clear();
		this.compiledPathsCache.clear();
		this.conditionMemoCache.clear();
		if (this.debugMode) {
			logger.info("Policy evaluation caches cleared");
		}
	}

	static addPolicy(policy: Policy): void {
		try {
			const result = policySchema.safeParse(policy);
			if (!result.success) {
				throw new PolicyValidationError("Invalid policy", result.error);
			}

			// Rebuild indexes (could be optimized for single add)
			this.buildIndexes([...this.exportPolicies(), policy]);

			if (this.debugMode) {
				logger.info("Policy added:", policy.id);
			}
		} catch (error) {
			logger.error("Error adding policy:", error);
			throw error;
		}
	}

	// Optimized: Lazy audit logging (defer expensive operations)
	private static auditLogLazy(
		context: AttributeContext,
		decision: "allow" | "deny" | "none",
		policyId?: string,
		matchedPolicies: Array<{
			id: string;
			effect: "allow" | "deny";
			description?: string;
		}> = [],
		error?: unknown
	): void {
		// Defer JSON.stringify and Date operations (only do if needed)
		// In production, consider async logging or buffering
		if (!this.debugMode && decision === "none" && !error) {
			return; // Skip audit for non-decisions unless debug mode
		}

		// Lazy evaluation: Only stringify when actually logging
		const auditEntry = {
			timestamp: new Date().toISOString(),
			userId: context.user?.id,
			patientId: context.patient?.id || context.resource?.attributes?.patientId,
			resourceType: context.resource?.type,
			resourceId: context.resource?.id,
			action: context.action,
			decision,
			policyId: policyId ?? undefined,
			matchedPolicyIds: matchedPolicies.map((p) => p.id),
			ip: context.environment?.ip,
			location: context.environment?.location,
			error: error instanceof Error ? error.message : undefined,
		};

		logger.info("[AUDIT]", JSON.stringify(auditEntry));
	}

	// Legacy method for backwards compatibility
	private static auditLog(
		context: AttributeContext,
		decision: "allow" | "deny" | "none",
		policyId?: string,
		matchedPolicyIds: string[] = [],
		error?: unknown
	): void {
		this.auditLogLazy(
			context,
			decision,
			policyId ?? undefined,
			matchedPolicyIds.map((id) => ({ id, effect: "allow" as const })),
			error
		);
	}

	static removePolicy(policyId: string): void {
		const allPolicies = this.exportPolicies();
		const filtered = allPolicies.filter((p) => p.id !== policyId);

		if (filtered.length !== allPolicies.length) {
			this.buildIndexes(filtered);
			if (this.debugMode) {
				logger.info(`Policy ${policyId} removed`);
			}
		}
	}

	static exportPolicies(): Policy[] {
		const policies = new Set<Policy>();
		this.resourceActionIndex.forEach((policyArray) => {
			policyArray.forEach((policy) => policies.add(policy));
		});
		return Array.from(policies);
	}
}

// Custom Errors
class PolicyValidationError extends Error {
	constructor(
		message: string,
		public readonly zodError: ZodError
	) {
		super(`${message}: ${zodError.errors.map((e) => e.message).join(", ")}`);
		this.name = "PolicyValidationError";
	}
}

class PolicyEvaluationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PolicyEvaluationError";
	}
}

// Initialize the engine
PolicyEngine.initialize();
