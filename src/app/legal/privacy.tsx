import { LegalDocument } from '@/components/legal-document';
import { Screen } from '@/components/ui/screen';
import { PRIVACY_BODY, PRIVACY_TITLE } from '@/lib/legal';

export default function PrivacyScreen() {
  return (
    <Screen>
      <LegalDocument title={PRIVACY_TITLE} body={PRIVACY_BODY} />
    </Screen>
  );
}
