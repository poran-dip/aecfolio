export type Payload = {
  name: string;
  html: string;
};

export type BulkPayload = {
  entries: Payload[];
};
