import { MergeTagInput, type MergeField, type SampleContact } from "./MergeTagInput";

const noop = () => {};
const FIELDS: MergeField[] = [
  { key: "contact.first_name", label: "First name" },
  { key: "appointment.time", label: "Appointment time" },
];
const TWO: SampleContact[] = [
  { label: "Sam", values: { "contact.first_name": "Sam", "appointment.time": "Fri 3 pm" } },
  { label: "No name", values: { "contact.first_name": "", "appointment.time": "Sat 11 am" } },
];

/** Every state, as a real instance with a fixed message. */
export const MERGE_TAG_INPUT_STATES = [
  { id: "clean", label: "All good", note: "Every tag is a real field and nobody gets a blank.", node: <MergeTagInput value="Hi {{contact.first_name | there}}, see you {{appointment.time}}." onChange={noop} fields={FIELDS} samples={TWO} /> },
  { id: "blank", label: "Blank for someone", note: "Amber tag, ⟨blank⟩ in that person's preview, one-click fallback.", node: <MergeTagInput value="Hi {{contact.first_name}}, see you {{appointment.time}}." onChange={noop} fields={FIELDS} samples={TWO} /> },
  { id: "unknown", label: "Unknown field", note: "Red tag, shown crossed out, suggests the field you meant.", node: <MergeTagInput value="Hi {{contact.frist_name}}!" onChange={noop} fields={FIELDS} samples={TWO} /> },
  { id: "unclosed", label: "Tag not closed", note: "Warns before a half tag goes out as raw text.", node: <MergeTagInput value="See you {{appointment.time" onChange={noop} fields={FIELDS} samples={TWO} /> },
  { id: "disabled", label: "Disabled", note: "Read-only while the campaign is sending.", node: <MergeTagInput value="Hi {{contact.first_name | there}}!" onChange={noop} fields={FIELDS} samples={TWO} disabled /> },
];
