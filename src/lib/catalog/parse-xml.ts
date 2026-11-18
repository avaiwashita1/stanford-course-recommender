// Converts the ExploreCourses XML feed (view=xml-20200810) into our Course objects.
import { XMLParser } from "fast-xml-parser";
import { extractPrereqText } from "./prereq-text";
import { parseDay, parseTime } from "./time";
import { TERMS, type Course, type Meeting, type Section, type Term } from "./types";

// Independent study and thesis sections: one per faculty member, not useful to show.
const INDEPENDENT_COMPONENTS = new Set(["INS", "T/D"]);

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false, // keep everything as strings; we convert explicitly
  trimValues: true,
  isArray: (name) =>
    ["course", "section", "schedule", "instructor"].includes(name),
});

type Raw = Record<string, unknown>;
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const arr = (v: unknown): Raw[] => (Array.isArray(v) ? (v as Raw[]) : []);
const child = (v: unknown, key: string): unknown =>
  v && typeof v === "object" ? (v as Raw)[key] : undefined;

function toTerm(raw: string): Term | null {
  // "2026-2027 Autumn" -> "Autumn"
  const last = raw.split(" ").pop() ?? "";
  return (TERMS as string[]).includes(last) ? (last as Term) : null;
}

function parseMeeting(s: Raw): Meeting {
  // <days> holds day names as whitespace-separated text, e.g. "Tuesday\n Thursday".
  const days = str(s.days)
    .split(/\s+/)
    .map(parseDay)
    .filter((d): d is NonNullable<typeof d> => d !== null);
  return {
    days,
    start: parseTime(str(s.startTime)),
    end: parseTime(str(s.endTime)),
    location: str(s.location) || null,
  };
}

function parseSection(s: Raw): Section | null {
  const term = toTerm(str(s.term));
  if (!term) return null;
  const schedules = arr(child(s.schedules, "schedule"));
  const instructors = new Set<string>();
  for (const sch of schedules) {
    for (const ins of arr(child(sch.instructors, "instructor"))) {
      const name = [str(ins.firstName), str(ins.lastName)].filter(Boolean).join(" ");
      if (name) instructors.add(name);
    }
  }
  return {
    classId: Number(str(s.classId)),
    term,
    sectionNumber: str(s.sectionNumber),
    component: str(s.component),
    primary: str(s.units) !== "",
    instructors: [...instructors],
    // Drop "meetings" that have no days and no times at all (pure placeholders),
    // but keep the section so we can show it as "Time TBA".
    meetings: schedules.map(parseMeeting).filter((m) => m.days.length || m.start),
    notes: str(s.notes) || null,
  };
}

export function parseCoursesXml(xml: string): Course[] {
  const doc = parser.parse(xml) as Raw;
  const courses = arr(child(child(doc.xml, "courses"), "course"));

  return courses.map((c): Course => {
    const allSections = arr(child(c.sections, "section"))
      .map(parseSection)
      .filter((s): s is Section => s !== null);
    const regular = allSections.filter((s) => !INDEPENDENT_COMPONENTS.has(s.component));

    // If no section in a term is marked primary (data quirk), treat all of that term's as primary.
    for (const term of TERMS) {
      const inTerm = regular.filter((s) => s.term === term);
      if (inTerm.length && !inTerm.some((s) => s.primary)) inTerm.forEach((s) => (s.primary = true));
    }

    const description = str(c.description);
    const subject = str(c.subject);
    const code = str(c.code);
    const sectionsForTerms = regular.length ? regular : allSections;

    return {
      id: `${subject} ${code}`,
      year: str(c.year),
      subject,
      code,
      title: str(c.title),
      description,
      unitsMin: Number(str(c.unitsMin)) || 0,
      unitsMax: Number(str(c.unitsMax)) || 0,
      gers: str(c.gers).split(",").map((g) => g.trim()).filter(Boolean),
      grading: str(c.grading),
      repeatable: str(c.repeatable) === "true",
      courseId: Number(str(child(c.administrativeInformation, "courseId"))) || 0,
      crossListings: [], // filled in later by linkCrossListings()
      prereqText: extractPrereqText(description),
      terms: TERMS.filter((t) => sectionsForTerms.some((s) => s.term === t)),
      independentStudy: allSections.length > 0 && regular.length === 0,
      sections: regular,
    };
  });
}
