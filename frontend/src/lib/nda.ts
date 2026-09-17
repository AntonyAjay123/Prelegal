export interface NdaFormData {
  party1Name: string;
  party1Company: string;
  party2Name: string;
  party2Company: string;
  purpose: string;
  effectiveDate: string;
  mndaTermType: "expires" | "continues";
  mndaTermYears: number;
  confidentialityTermType: "years" | "perpetuity";
  confidentialityTermYears: number;
  governingLaw: string;
  jurisdiction: string;
}

export const defaultNdaFormData: NdaFormData = {
  party1Name: "",
  party1Company: "",
  party2Name: "",
  party2Company: "",
  purpose: "evaluating a potential business relationship between the parties",
  effectiveDate: "",
  mndaTermType: "expires",
  mndaTermYears: 1,
  confidentialityTermType: "years",
  confidentialityTermYears: 1,
  governingLaw: "",
  jurisdiction: "",
};

function formatDate(isoDate: string): string {
  if (!isoDate) return "[Effective Date not provided]";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function yearsLabel(years: number): string {
  const n = Number.isFinite(years) && years > 0 ? Math.round(years) : 1;
  return `${n} year${n === 1 ? "" : "s"}`;
}

/**
 * Fills the cover page template with the user's answers. Uses exact
 * substring matches against the known template text rather than a generic
 * parser, since the source markdown (templates/mutual-nda-coverpage.md) is
 * a fixed file we control.
 */
export function buildCoverPage(
  data: NdaFormData,
  coverPageTemplate: string
): string {
  // Normalize CRLF to LF first — the source file has Windows line endings,
  // and the literal multi-line matches below use plain "\n" so they must
  // agree with the string being searched or they silently fail to match.
  let text = coverPageTemplate.replace(/\r\n/g, "\n");

  // Strip the `<label>hint text</label>` annotations that guide a human
  // filling the cover page by hand — redundant once fields are auto-filled.
  text = text.replace(/^<label>.*<\/label>\n?/gm, "");

  text = text.replace(
    "[Evaluating whether to enter into a business relationship with the other party.]",
    data.purpose.trim() || "[Purpose not provided]"
  );

  text = text.replace("[Today’s date]", formatDate(data.effectiveDate));

  const mndaExpires = data.mndaTermType === "expires";
  text = text.replace(
    "- [x]     Expires [1 year(s)] from Effective Date.\n- [ ]     Continues until terminated in accordance with the terms of the MNDA.",
    [
      `- [${mndaExpires ? "x" : " "}]     Expires ${yearsLabel(
        data.mndaTermYears
      )} from Effective Date.`,
      `- [${
        mndaExpires ? " " : "x"
      }]     Continues until terminated in accordance with the terms of the MNDA.`,
    ].join("\n")
  );

  const confidentialityYears = data.confidentialityTermType === "years";
  text = text.replace(
    "- [x]     [1 year(s)] from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.\n- [ ]     In perpetuity.",
    [
      `- [${confidentialityYears ? "x" : " "}]     ${yearsLabel(
        data.confidentialityTermYears
      )} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`,
      `- [${
        confidentialityYears ? " " : "x"
      }]     In perpetuity.`,
    ].join("\n")
  );

  text = text.replace(
    "Governing Law: [Fill in state]",
    `Governing Law: ${data.governingLaw.trim() || "[Governing Law not provided]"}`
  );
  text = text.replace(
    "Jurisdiction: [Fill in city or county and state, i.e. “courts located in New Castle, DE”]",
    `Jurisdiction: ${data.jurisdiction.trim() || "[Jurisdiction not provided]"}`
  );

  const partyTable = /\|\| PARTY 1 \| PARTY 2 \|[\s\S]*?\| Date \| \| \|/;
  const filledTable = [
    "| | PARTY 1 | PARTY 2 |",
    "|:--- | :---: | :---: |",
    "| Signature | | |",
    `| Print Name | ${data.party1Name.trim()} | ${data.party2Name.trim()} |`,
    "| Title | | |",
    `| Company | ${data.party1Company.trim()} | ${data.party2Company.trim()} |`,
    "| Notice Address | | |",
    "| Date | | |",
  ].join("\n");
  text = text.replace(partyTable, filledTable);

  return text;
}

/**
 * Replaces every `<span class="coverpage_link">Label</span>` reference in
 * the Standard Terms with the corresponding user-entered value, so the
 * final document reads as a complete, self-contained NDA.
 */
export function buildStandardTerms(
  data: NdaFormData,
  standardTermsTemplate: string
): string {
  const mndaTermText =
    data.mndaTermType === "expires"
      ? `${yearsLabel(data.mndaTermYears)} period beginning on the Effective Date`
      : "period ending upon termination of this MNDA in accordance with its terms";

  const confidentialityTermText =
    data.confidentialityTermType === "years"
      ? `${yearsLabel(
          data.confidentialityTermYears
        )} period following the Effective Date (or, for trade secrets, until no longer considered a trade secret under applicable law)`
      : "indefinite term";

  const replacements: Record<string, string> = {
    Purpose: data.purpose.trim() || "[Purpose not provided]",
    "Effective Date": formatDate(data.effectiveDate),
    "MNDA Term": mndaTermText,
    "Term of Confidentiality": confidentialityTermText,
    "Governing Law": data.governingLaw.trim() || "[Governing Law not provided]",
    Jurisdiction: data.jurisdiction.trim() || "[Jurisdiction not provided]",
  };

  return standardTermsTemplate
    .replace(/\r\n/g, "\n")
    .replace(
      /<span class="coverpage_link">([^<]+)<\/span>/g,
      (_match, label: string) => replacements[label] ?? label
    );
}

export function buildCompletedNda(
  data: NdaFormData,
  standardTermsTemplate: string,
  coverPageTemplate: string
): string {
  const coverPage = buildCoverPage(data, coverPageTemplate);
  const standardTerms = buildStandardTerms(data, standardTermsTemplate);
  return `${coverPage}\n\n---\n\n${standardTerms}`;
}

export function getMissingFields(data: NdaFormData): string[] {
  const missing: string[] = [];
  if (!data.party1Name.trim()) missing.push("Party 1 name");
  if (!data.party2Name.trim()) missing.push("Party 2 name");
  if (!data.purpose.trim()) missing.push("Purpose");
  if (!data.effectiveDate.trim()) missing.push("Effective date");
  if (!data.governingLaw.trim()) missing.push("Governing law");
  if (!data.jurisdiction.trim()) missing.push("Jurisdiction");
  return missing;
}
