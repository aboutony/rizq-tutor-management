import { redirect } from "next/navigation";

export default function LocaleHome({
    params: { locale },
}: {
    params: { locale: string };
}) {
    redirect(`/${locale}/auth/login`);
}
