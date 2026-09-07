import { LegalDocument } from '@/components/legal-document';
import { Screen } from '@/components/ui/screen';
import { TERMS_BODY, TERMS_TITLE } from '@/lib/legal';

export default function TermsScreen() {
  return (
    <Screen>
      <LegalDocument title={TERMS_TITLE} body={TERMS_BODY} />
    </Screen>
  );
}
