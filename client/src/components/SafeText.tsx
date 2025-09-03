import { sanitizeText } from "@shared/safeLanguage"; type Props = { children: string }; export default function SafeText({ children }: Props) { return <>{sanitizeText(children)}</>;
}