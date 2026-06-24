export class BaseAdapter {
  async fetch() {
    throw new Error("fetch() must be implemented by adapter")
  }
}
