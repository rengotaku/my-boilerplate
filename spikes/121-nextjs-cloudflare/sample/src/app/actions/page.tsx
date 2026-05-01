import { GreetForm } from "./GreetForm";

export default async function ActionsPage() {
  const renderedAt = new Date().toISOString();

  return (
    <main className="p-8 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Server Action sample</h1>
      <p>RSC rendered at: {renderedAt}</p>
      <GreetForm />
    </main>
  );
}
