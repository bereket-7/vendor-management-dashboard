"use client";

import {
	ExternalRefLink,
	MEASURE_CALLOUT,
	MEASURE_TABLE_MUTED,
	MEASURE_TAB_STACK,
	MeasureDataTable,
	MeasureField,
	MeasureFieldGrid,
	MeasureSectionPanel,
	MeasureSubsection,
	PdfLink,
} from "@/features/admin/features/claim-encounter/quality-performance/measure-library/MeasureDetailShared";
import type { MeasureSpecifications } from "@/features/admin/features/claim-encounter/quality-performance/measure-library/mock-data";

export function MeasureDetailSpecificationsTab({
	specifications,
}: {
	specifications: MeasureSpecifications;
}) {
	return (
		<div className={MEASURE_TAB_STACK}>
			<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
				<MeasureSectionPanel
					title="Specifications"
					subtitle="Official measure logic, statements, and reporting parameters"
					action={<PdfLink label="View Full Measure Specification (PDF)" />}
					bodyClassName="space-y-3 p-0"
				>
					<div className={MEASURE_CALLOUT}>
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Measure Description
						</p>
						<p className="mt-2 text-sm leading-relaxed text-foreground">
							{specifications.measureDescription}
						</p>
					</div>

					<MeasureSubsection
						title="Numerator & Denominator"
						description="Core measure statements defining who is counted"
					>
						<div className="space-y-3">
							<MeasureField
								label="Numerator Statement"
								value={
									<p className="leading-relaxed">
										{specifications.numeratorStatement}
									</p>
								}
							/>
							<MeasureField
								label="Denominator Statement"
								value={
									<p className="leading-relaxed">
										{specifications.denominatorStatement}
									</p>
								}
							/>
						</div>
					</MeasureSubsection>

					<MeasureSubsection
						title="Population & Timing"
						description="Eligible members and enrollment requirements"
					>
						<MeasureFieldGrid
							fields={[
								{
									label: "Eligible Population",
									value: specifications.eligiblePopulation,
								},
								{
									label: "Measurement Year",
									value: specifications.measurementYear,
								},
								{
									label: "Look-Back Period",
									value: specifications.lookBackPeriod,
								},
								{
									label: "Continuous Enrollment",
									value: specifications.continuousEnrollment,
								},
								{
									label: "Measure Steward",
									value: specifications.measureSteward,
								},
							]}
						/>
					</MeasureSubsection>

					<MeasureSubsection
						title="Data & Calculation"
						description="Sources, settings, and calculation approach"
					>
						<MeasureFieldGrid
							fields={[
								{ label: "Data Sources", value: specifications.dataSources },
								{ label: "Care Setting", value: specifications.careSetting },
								{
									label: "Collection Method",
									value: specifications.collectionMethod,
								},
								{
									label: "Calculation Method",
									value: specifications.calculationMethod,
								},
								{
									label: "Inverse Measure",
									value: specifications.inverseMeasure,
								},
								{
									label: "Higher Rate is Better",
									value: specifications.higherRateIsBetter,
								},
							]}
						/>
					</MeasureSubsection>

					<MeasureSubsection title="Reporting & Stratification">
						<MeasureFieldGrid
							fields={[
								{
									label: "Stratifications",
									value: specifications.stratifications,
								},
								{ label: "Measure Type", value: specifications.measureType },
								{
									label: "NCQA Reporting",
									value: specifications.ncqaReporting,
								},
							]}
							columns={3}
						/>
					</MeasureSubsection>
				</MeasureSectionPanel>

				<div className="space-y-3">
					<MeasureSectionPanel
						title="Clinical Focus"
						subtitle="Primary clinical area for this measure"
						bodyClassName="p-0"
					>
						<div className={MEASURE_CALLOUT}>
							<p className="text-sm font-semibold text-foreground">
								{specifications.clinicalFocus}
							</p>
						</div>
					</MeasureSectionPanel>

					<MeasureSectionPanel title="References" bodyClassName="space-y-2 p-0">
						{specifications.references.map((ref) => (
							<ExternalRefLink key={ref.label} label={ref.label} />
						))}
					</MeasureSectionPanel>
				</div>
			</div>

			<div className="grid gap-3 lg:grid-cols-2">
				<MeasureSectionPanel
					title="Key Definitions"
					subtitle="Terms used in this measure specification"
					bodyClassName="p-0"
				>
					<MeasureDataTable
						columns={[
							{ key: "term", header: "Term", className: "font-medium" },
							{
								key: "definition",
								header: "Definition",
								className: MEASURE_TABLE_MUTED,
							},
						]}
						rows={specifications.keyDefinitions.map((row) => ({
							term: row.term,
							definition: row.definition,
						}))}
						getRowKey={(row) => String(row.term)}
					/>
				</MeasureSectionPanel>

				<MeasureSectionPanel
					title="Value Set / Code Sets"
					subtitle="Referenced code lists and versions"
					bodyClassName="p-0"
				>
					<MeasureDataTable
						columns={[
							{ key: "type", header: "Type" },
							{ key: "codeSetName", header: "Code Set Name" },
							{
								key: "version",
								header: "Version",
								className: MEASURE_TABLE_MUTED,
							},
						]}
						rows={specifications.valueSets.map((row) => ({
							type: row.type,
							codeSetName: row.codeSetName,
							version: row.version,
						}))}
						getRowKey={(row) => `${row.type}-${row.codeSetName}`}
					/>
				</MeasureSectionPanel>
			</div>
		</div>
	);
}
