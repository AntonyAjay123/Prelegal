import { describe, expect, it } from "vitest";
import {
  buildCoverPage,
  buildStandardTerms,
  defaultNdaFormData,
  type NdaFormData,
} from "./nda";

// Mirrors the parts of templates/mutual-nda-coverpage.md that buildCoverPage
// matches against verbatim. Kept as a literal fixture (rather than reading
// the real file) so these tests stay deterministic regardless of the
// checked-out line-ending style, and can independently pin the LF vs CRLF
// behavior below.
const COVER_PAGE_FIXTURE_LF = [
  "# Mutual Non-Disclosure Agreement",
  "",
  "### Purpose",
  "<label>How Confidential Information may be used</label>",
  "",
  "[Evaluating whether to enter into a business relationship with the other party.]",
  "",
  "### Effective Date",
  "[Today’s date]",
  "",
  "### MNDA Term",
  "<label>The length of this MNDA</label>",
  "- [x]     Expires [1 year(s)] from Effective Date.",
  "- [ ]     Continues until terminated in accordance with the terms of the MNDA.",
  "",
  "### Term of Confidentiality",
  "<label>How long Confidential Information is protected</label>",
  "- [x]     [1 year(s)] from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.",
  "- [ ]     In perpetuity.",
  "",
  "### Governing Law & Jurisdiction",
  "Governing Law: [Fill in state]",
  "",
  "Jurisdiction: [Fill in city or county and state, i.e. “courts located in New Castle, DE”]",
  "",
  "|| PARTY 1 | PARTY 2 |",
  "|:--- | :----: | :----: |",
  "| Signature | | |",
  "| Print Name | |",
  "| Title | | |",
  "| Company | | |",
  "| Notice Address <label>Use either email or postal address</label> | | |",
  "| Date | | |",
].join("\n");

const COVER_PAGE_FIXTURE_CRLF = COVER_PAGE_FIXTURE_LF.replace(/\n/g, "\r\n");

// Mirrors the coverpage_link span usage in templates/mutual-nda.md. Purpose
// and Governing Law each appear twice to verify the global replace covers
// every occurrence, and "Something Else" checks the fallback for a label
// with no known mapping.
const STANDARD_TERMS_FIXTURE_LF = [
  'This MNDA covers <span class="coverpage_link">Purpose</span> and, again, <span class="coverpage_link">Purpose</span>.',
  'Effective on <span class="coverpage_link">Effective Date</span>.',
  'Term: <span class="coverpage_link">MNDA Term</span>.',
  'Confidentiality: <span class="coverpage_link">Term of Confidentiality</span>.',
  'Governed by <span class="coverpage_link">Governing Law</span>, per <span class="coverpage_link">Governing Law</span>.',
  'Venue: <span class="coverpage_link">Jurisdiction</span>.',
  'Unknown: <span class="coverpage_link">Something Else</span>.',
].join("\n");

const STANDARD_TERMS_FIXTURE_CRLF = STANDARD_TERMS_FIXTURE_LF.replace(
  /\n/g,
  "\r\n"
);

function makeData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return { ...defaultNdaFormData, ...overrides };
}

describe("buildCoverPage", () => {
  it("substitutes the purpose", () => {
    const result = buildCoverPage(
      makeData({ purpose: "negotiating a supply agreement" }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(result).toContain("negotiating a supply agreement");
    expect(result).not.toContain(
      "[Evaluating whether to enter into a business relationship"
    );
  });

  it("falls back to a placeholder when the purpose is blank", () => {
    const result = buildCoverPage(
      makeData({ purpose: "   " }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(result).toContain("[Purpose not provided]");
  });

  it("formats a provided effective date and falls back when empty", () => {
    const withDate = buildCoverPage(
      makeData({ effectiveDate: "2026-03-05" }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(withDate).toContain("March 5, 2026");

    const withoutDate = buildCoverPage(
      makeData({ effectiveDate: "" }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(withoutDate).toContain("[Effective Date not provided]");
  });

  it("checks the Expires box and fills the year count when mndaTermType is 'expires'", () => {
    const result = buildCoverPage(
      makeData({ mndaTermType: "expires", mndaTermYears: 3 }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(result).toContain("- [x]     Expires 3 years from Effective Date.");
    expect(result).toContain(
      "- [ ]     Continues until terminated in accordance with the terms of the MNDA."
    );
  });

  it("uses singular 'year' for a count of 1", () => {
    const result = buildCoverPage(
      makeData({ mndaTermType: "expires", mndaTermYears: 1 }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(result).toContain("Expires 1 year from Effective Date.");
  });

  it("checks the Continues box when mndaTermType is 'continues'", () => {
    const result = buildCoverPage(
      makeData({ mndaTermType: "continues" }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(result).toContain(
      "- [ ]     Expires 1 year from Effective Date."
    );
    expect(result).toContain(
      "- [x]     Continues until terminated in accordance with the terms of the MNDA."
    );
  });

  it("checks the years box and fills the year count when confidentialityTermType is 'years'", () => {
    const result = buildCoverPage(
      makeData({ confidentialityTermType: "years", confidentialityTermYears: 2 }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(result).toContain(
      "- [x]     2 years from Effective Date, but in the case of trade secrets"
    );
    expect(result).toContain("- [ ]     In perpetuity.");
  });

  it("checks the perpetuity box when confidentialityTermType is 'perpetuity'", () => {
    const result = buildCoverPage(
      makeData({ confidentialityTermType: "perpetuity" }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(result).toContain(
      "- [ ]     1 year from Effective Date, but in the case of trade secrets"
    );
    expect(result).toContain("- [x]     In perpetuity.");
  });

  it("clamps non-positive or fractional year counts to a sane whole number", () => {
    const zero = buildCoverPage(
      makeData({ mndaTermType: "expires", mndaTermYears: 0 }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(zero).toContain("Expires 1 year from Effective Date.");

    const negative = buildCoverPage(
      makeData({ mndaTermType: "expires", mndaTermYears: -5 }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(negative).toContain("Expires 1 year from Effective Date.");

    const fractional = buildCoverPage(
      makeData({ mndaTermType: "expires", mndaTermYears: 2.5 }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(fractional).toContain("Expires 3 years from Effective Date.");
  });

  it("substitutes governing law and jurisdiction, with placeholders when blank", () => {
    const filled = buildCoverPage(
      makeData({ governingLaw: "Delaware", jurisdiction: "New Castle, DE" }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(filled).toContain("Governing Law: Delaware");
    expect(filled).toContain("Jurisdiction: New Castle, DE");

    const blank = buildCoverPage(makeData(), COVER_PAGE_FIXTURE_LF);
    expect(blank).toContain("Governing Law: [Governing Law not provided]");
    expect(blank).toContain("Jurisdiction: [Jurisdiction not provided]");
  });

  it("fills the party table with trimmed names and companies", () => {
    const result = buildCoverPage(
      makeData({
        party1Name: "  Alice Johnson  ",
        party1Company: "Acme Corp",
        party2Name: "Bob Lee",
        party2Company: "  Beta LLC",
      }),
      COVER_PAGE_FIXTURE_LF
    );
    expect(result).toContain("| Print Name | Alice Johnson | Bob Lee |");
    expect(result).toContain("| Company | Acme Corp | Beta LLC |");
  });

  it("strips the <label> fill-in hints and the manual party-table instructions", () => {
    const result = buildCoverPage(makeData(), COVER_PAGE_FIXTURE_LF);
    expect(result).not.toContain("<label>");
    expect(result).not.toContain("</label>");
  });

  it("produces the same output for CRLF and LF versions of the template", () => {
    const data = makeData({
      purpose: "evaluating a pilot program",
      effectiveDate: "2026-03-05",
      mndaTermType: "continues",
      confidentialityTermType: "perpetuity",
      governingLaw: "Delaware",
      jurisdiction: "New Castle, DE",
      party1Name: "Alice",
      party2Name: "Bob",
    });

    const fromLf = buildCoverPage(data, COVER_PAGE_FIXTURE_LF);
    const fromCrlf = buildCoverPage(data, COVER_PAGE_FIXTURE_CRLF);

    expect(fromCrlf).toBe(fromLf);
    // Specifically confirm the checkbox substitution — the exact behavior
    // that silently no-op'd against a CRLF template before the fix — did
    // not just fall back to the untouched default text.
    expect(fromCrlf).toContain(
      "- [x]     Continues until terminated in accordance with the terms of the MNDA."
    );
    expect(fromCrlf).toContain("- [x]     In perpetuity.");
  });
});

describe("buildStandardTerms", () => {
  it("replaces every occurrence of a repeated coverpage_link label", () => {
    const result = buildStandardTerms(
      makeData({ purpose: "a joint research project" }),
      STANDARD_TERMS_FIXTURE_LF
    );
    const occurrences = result.match(/a joint research project/g) ?? [];
    expect(occurrences).toHaveLength(2);
    expect(result).not.toContain("coverpage_link");
  });

  it("falls back to a placeholder when the purpose is blank", () => {
    const result = buildStandardTerms(
      makeData({ purpose: "" }),
      STANDARD_TERMS_FIXTURE_LF
    );
    expect(result).toContain("[Purpose not provided]");
  });

  it("formats the effective date and falls back when empty", () => {
    const withDate = buildStandardTerms(
      makeData({ effectiveDate: "2026-03-05" }),
      STANDARD_TERMS_FIXTURE_LF
    );
    expect(withDate).toContain("Effective on March 5, 2026.");

    const withoutDate = buildStandardTerms(
      makeData({ effectiveDate: "" }),
      STANDARD_TERMS_FIXTURE_LF
    );
    expect(withoutDate).toContain("[Effective Date not provided]");
  });

  it("describes the MNDA term for the 'expires' branch", () => {
    const result = buildStandardTerms(
      makeData({ mndaTermType: "expires", mndaTermYears: 2 }),
      STANDARD_TERMS_FIXTURE_LF
    );
    expect(result).toContain(
      "Term: 2 years period beginning on the Effective Date."
    );
  });

  it("describes the MNDA term for the 'continues' branch", () => {
    const result = buildStandardTerms(
      makeData({ mndaTermType: "continues" }),
      STANDARD_TERMS_FIXTURE_LF
    );
    expect(result).toContain(
      "Term: period ending upon termination of this MNDA in accordance with its terms."
    );
  });

  it("describes the confidentiality term for the 'years' branch", () => {
    const result = buildStandardTerms(
      makeData({ confidentialityTermType: "years", confidentialityTermYears: 5 }),
      STANDARD_TERMS_FIXTURE_LF
    );
    expect(result).toContain(
      "Confidentiality: 5 years period following the Effective Date"
    );
  });

  it("describes the confidentiality term for the 'perpetuity' branch", () => {
    const result = buildStandardTerms(
      makeData({ confidentialityTermType: "perpetuity" }),
      STANDARD_TERMS_FIXTURE_LF
    );
    expect(result).toContain("Confidentiality: indefinite term.");
  });

  it("replaces every occurrence of governing law and substitutes jurisdiction", () => {
    const result = buildStandardTerms(
      makeData({ governingLaw: "Delaware", jurisdiction: "New Castle, DE" }),
      STANDARD_TERMS_FIXTURE_LF
    );
    const occurrences = result.match(/Delaware/g) ?? [];
    expect(occurrences).toHaveLength(2);
    expect(result).toContain("Venue: New Castle, DE.");
  });

  it("falls back to the label text itself for an unrecognized coverpage_link", () => {
    const result = buildStandardTerms(makeData(), STANDARD_TERMS_FIXTURE_LF);
    expect(result).toContain("Unknown: Something Else.");
  });

  it("produces the same content for CRLF and LF versions of the template", () => {
    const data = makeData({
      purpose: "a joint research project",
      governingLaw: "Delaware",
      jurisdiction: "New Castle, DE",
    });

    const fromLf = buildStandardTerms(data, STANDARD_TERMS_FIXTURE_LF);
    const fromCrlf = buildStandardTerms(data, STANDARD_TERMS_FIXTURE_CRLF);

    expect(fromCrlf).toBe(fromLf);
    expect(fromCrlf).toContain("a joint research project");
    expect(fromCrlf).not.toContain("\r");
  });
});
