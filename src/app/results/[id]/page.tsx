import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function ResultsRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/call/${id}`);
}
