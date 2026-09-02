import { z } from "zod";

import adminComponentPolicies from "./policies/admin-components.json";
import documentAccessPolicy from "./policies/document-access.json";

export type AttributeScalar = string | number | boolean | null;

export type AttributeValue =
	| AttributeScalar
	| AttributeValue[]
	| { [key: string]: AttributeValue };

export type AttributeMap = Record<string, AttributeValue>;

export type ContextEntity = {
	id?: string;
	attributes?: AttributeMap;
	[key: string]: AttributeValue | AttributeMap | undefined;
};

// 1. Enhanced Type Definitions
export type Condition =
	| { type: "allOf"; conditions: Condition[] }
	| { type: "anyOf"; conditions: Condition[] }
	| { type: "not"; condition: Condition }
	| {
			type: "attribute";
			attribute: string;
			operator: string;
			value?: AttributeValue;
	  };

export type PolicyTarget = {
	roles?: string[];
	resources: string[];
	actions: string[];
};

export type Policy = {
	id: string;
	effect: "allow" | "deny";
	description?: string;
	priority: number;
	target: PolicyTarget;
	conditions: Condition;
};

export type AttributeContext = {
	action: string;
	user: {
		id: string;
		roles: string[];
		attributes: AttributeMap;
	} & Record<string, AttributeValue | string[] | AttributeMap | undefined>;
	resource: {
		type: string;
		id?: string;
		attributes: AttributeMap;
	} & Record<string, AttributeValue | AttributeMap | undefined>;
	environment: {
		time: string;
		ip?: string;
		location?: string;
	} & Record<string, AttributeValue | undefined>;
	patient?: ContextEntity;
	encounter?: ContextEntity;
	organization?: ContextEntity;
	consent?: ContextEntity;
};

export type EvaluationResult = {
	allowed: boolean;
	decision: "allow" | "deny" | "none";
	matchedPolicies: Array<{
		id: string;
		effect: "allow" | "deny";
		description?: string;
	}>;
	allowedBy?: string;
	deniedBy?: string;
};

export const attributeValueSchema: z.ZodType<AttributeValue> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.null(),
		z.array(attributeValueSchema),
		z.record(attributeValueSchema),
	])
);

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
	z.discriminatedUnion("type", [
		z.object({
			type: z.literal("allOf"),
			conditions: z.array(conditionSchema),
		}),
		z.object({
			type: z.literal("anyOf"),
			conditions: z.array(conditionSchema),
		}),
		z.object({
			type: z.literal("not"),
			condition: conditionSchema,
		}),
		z.object({
			type: z.literal("attribute"),
			attribute: z.string(),
			operator: z.string(),
			value: attributeValueSchema.optional(),
		}),
	])
);

export const policySchema = z.object({
	id: z.string(),
	effect: z.enum(["allow", "deny"]),
	description: z.string().optional(),
	priority: z.number().int().positive(),
	target: z.object({
		roles: z.array(z.string()).optional(),
		resources: z.array(z.string()).nonempty(),
		actions: z.array(z.string()).nonempty(),
	}),
	conditions: conditionSchema,
});

function parsePolicyFile(raw: unknown): Policy[] {
	if (Array.isArray(raw)) {
		return z.array(policySchema).parse(raw);
	}

	if (raw && typeof raw === "object" && "policies" in raw) {
		return z.array(policySchema).parse((raw as { policies: unknown }).policies);
	}

	return z.array(policySchema).parse([raw]);
}

export const parsedPolicies = [
	...parsePolicyFile(documentAccessPolicy),
	...parsePolicyFile(adminComponentPolicies),
];
