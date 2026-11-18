// Small builders for tests, so each test only spells out what it cares about.
import type { Course, Meeting, Section } from "./types";

export function meeting(partial: Partial<Meeting> = {}): Meeting {
  return { days: ["Mon", "Wed", "Fri"], start: "10:30", end: "11:20", location: null, ...partial };
}

export function section(partial: Partial<Section> = {}): Section {
  return {
    classId: 1,
    term: "Autumn",
    sectionNumber: "01",
    component: "LEC",
    primary: true,
    instructors: [],
    meetings: [meeting()],
    notes: null,
    ...partial,
  };
}

export function course(partial: Partial<Course> = {}): Course {
  return {
    id: "CS 101",
    year: "2026-2027",
    subject: "CS",
    code: "101",
    title: "Test Course",
    description: "",
    unitsMin: 3,
    unitsMax: 5,
    gers: [],
    grading: "Letter",
    repeatable: false,
    courseId: 1,
    crossListings: [],
    prereqText: null,
    terms: ["Autumn"],
    independentStudy: false,
    sections: [section()],
    ...partial,
  };
}
