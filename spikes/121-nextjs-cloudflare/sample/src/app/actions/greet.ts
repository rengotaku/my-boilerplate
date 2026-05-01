"use server";

export async function greet(formData: FormData) {
  const name = String(formData.get("name") ?? "world");
  return { message: `hello, ${name}!`, at: new Date().toISOString() };
}
