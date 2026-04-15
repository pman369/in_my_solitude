import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'The Curator <curator@inmysolitude.app>'; // You would replace this with a verified domain email when in production

// Common ethereal styling for emails
const EMAIL_STYLES = `
  body { font-family: 'Georgia', serif; background-color: #0D0D0D; color: #F0EDE6; margin: 0; padding: 40px; }
  .container { max-width: 600px; margin: 0 auto; border: 1px solid #2A2A2A; padding: 40px; background-color: #141414; border-radius: 8px; }
  h1 { color: #C9A84C; font-weight: normal; font-size: 24px; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid #2A2A2A; padding-bottom: 20px; }
  p { line-height: 1.8; color: #9A9088; font-size: 14px; }
  .valediction { font-style: italic; margin-top: 40px; color: #C9A84C; }
  .note { background: #1A1A1A; padding: 20px; border-left: 2px solid #C9A84C; margin: 20px 0; font-style: italic; font-size: 13px; color: #F0EDE6; }
`;

function buildEmailHtml(title: string, content: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${EMAIL_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          ${content}
          <div class="valediction">
            The Library awaits your quiet return,<br/><br/>
            — The Solitary Curator
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = buildEmailHtml(
    'Welcome to the Archives',
    `
    <p>Greetings, ${name}.</p>
    <p>Your sanctuary is ready. You have successfully bound your signature to the library's registry.</p>
    <p>Here, silence is observed not as a rule, but as a reverence for the knowledge kept within the Stacks. You may now withdraw volumes, leave annotations in the margins, and request passage into the restricted Vault.</p>
    `
  );

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Your desk in the library is prepared.',
    html,
  });
}

export async function sendVaultRequestReceivedEmail(to: string, bookTitle: string) {
  const html = buildEmailHtml(
    'Petition Under Review',
    `
    <p>Your request for access has been recorded.</p>
    <p>I have received your petition to withdraw <strong>"${bookTitle}"</strong> from the Vault. Restricted materials require a careful evaluation of intent.</p>
    <p>I will review your reasons shortly. You will receive parchment by mail once a judgment is made.</p>
    `
  );

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Petition Received: ${bookTitle}`,
    html,
  });
}

export async function sendVaultRequestApprovedEmail(to: string, bookTitle: string, adminNote?: string) {
  let notesHtml = '';
  if (adminNote) {
    notesHtml = `<div class="note"><strong>Curator's Note:</strong> ${adminNote}</div>`;
  }

  const html = buildEmailHtml(
    'Vault Passage Granted',
    `
    <p>Your petition has been approved.</p>
    <p>You have been granted access to <strong>"${bookTitle}"</strong>. A private reading room has been allocated for your study of this material.</p>
    ${notesHtml}
    <p>Please handle these texts with the utmost discretion.</p>
    `
  );

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Access Granted: ${bookTitle}`,
    html,
  });
}

export async function sendVaultRequestDeniedEmail(to: string, bookTitle: string, adminNote?: string) {
  let notesHtml = '';
  if (adminNote) {
    notesHtml = `<div class="note"><strong>Curator's Note:</strong> ${adminNote}</div>`;
  }

  const html = buildEmailHtml(
    'Vault Passage Denied',
    `
    <p>Your petition has been carefully considered.</p>
    <p>I regret to inform you that access to <strong>"${bookTitle}"</strong> cannot be granted at this time. Such materials bear certain psychological weights that we must guard against.</p>
    ${notesHtml}
    <p>You may submit another petition in the future should your circumstances or understanding evolve.</p>
    `
  );

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Access Denied: ${bookTitle}`,
    html,
  });
}
