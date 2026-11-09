/* ==========================================================================
   RESUME MAILER — Google Apps Script that runs on your Gmail account.
   When a client requests your resume on the site, it:
     1. emails the resume to the client as an attachment, from your Gmail
     2. emails you a copy of the request (just press Reply to answer the client)

   SETUP (about 5 minutes)
     1. Go to https://script.google.com while signed in to your Gmail, and click New project.
     2. Delete what's there, paste this whole file in, and set SITE_BASE below.
     3. Click Deploy > New deployment > gear icon > Web app.
        Execute as: Me.   Who has access: Anyone.   Click Deploy.
     4. Approve the permissions. If Google warns the app isn't verified, click
        Advanced > Go to project (it's your own script).
     5. Copy the Web app URL and put it in resumeMailUrl at the top of script.js.

   If you change this file later: Deploy > Manage deployments > edit > New version.
   ========================================================================== */
const SETTINGS = {
  OWNER_EMAIL: 'melbrionvirtual@gmail.com',
  OWNER_NAME: 'Romelito Briones',
  SITE_BASE: 'https://YOUR-USERNAME.github.io/YOUR-REPO/', // your site's address, ending with a slash
  DAILY_LIMIT: 40,  // requests per day (each one uses 2 of Gmail's ~100 daily recipients)
  REPEAT_HOURS: 6   // the same address gets the resume only once in this many hours
};

function doPost(e) {
  let result;
  try {
    result = handleRequest((e && e.parameter) || {});
  } catch (err) {
    console.error(err);
    result = { ok: false, error: 'server' };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function handleRequest(params) {
  if (params.website) return { ok: true }; // hidden field only bots fill in: pretend it worked, send nothing

  const email = String(params.email || '').trim().toLowerCase();
  if (email.length > 200 || !/^[^@\s,;<>"]+@[^@\s,;<>"]+\.[^@\s,;<>"]+$/.test(email)) return { ok: false, error: 'email' };

  const resume = checkResumeUrl(String(params.resumeUrl || ''));
  if (!resume) return { ok: false, error: 'resume' };

  const message = String(params.message || '').slice(0, 2000);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const cache = CacheService.getScriptCache(), seenKey = 'sent:' + email;
    if (cache.get(seenKey)) return { ok: true }; // already sent recently
    if (MailApp.getRemainingDailyQuota() < 2 || !takeDailySlot()) return { ok: false, error: 'busy' };

    const response = UrlFetchApp.fetch(resume.url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) return { ok: false, error: 'resume' };
    const attachment = response.getBlob().setName(`${SETTINGS.OWNER_NAME.replace(/\s+/g, '-')}-Resume.${resume.ext}`);
    const subject = `${SETTINGS.OWNER_NAME} Resume Request`;

    // The client's text is never included here, so this can't be used to send other content to someone
    MailApp.sendEmail({
      to: email,
      subject: `Re: ${subject}`,
      name: SETTINGS.OWNER_NAME,
      replyTo: SETTINGS.OWNER_EMAIL,
      body: `Hi there,\n\nThank you for your interest and for requesting my resume. I've attached a copy to this email.\n\nIf you'd like to talk about a project or role, just reply to this message and I'll get back to you personally.\n\nBest regards,\n${SETTINGS.OWNER_NAME}`,
      attachments: [attachment]
    });
    cache.put(seenKey, '1', SETTINGS.REPEAT_HOURS * 3600);

    MailApp.sendEmail({
      to: SETTINGS.OWNER_EMAIL,
      subject: `${subject} from ${email}`,
      name: 'Portfolio Resume Request',
      replyTo: email,
      body: `From: ${email}\n\n${message}\n\n---\nYour resume was sent to this address automatically. Press Reply to answer them.`
    });
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// Only files in this site's resumes/ folder may be attached, whatever the request says
function checkResumeUrl(url) {
  if (url.indexOf(SETTINGS.SITE_BASE) !== 0) return null;
  const match = /^resumes\/[A-Za-z0-9_-]+\.(pdf|docx?)$/i.exec(url.slice(SETTINGS.SITE_BASE.length));
  return match ? { url, ext: match[1].toLowerCase() } : null;
}

function takeDailySlot() {
  const props = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd');
  const saved = JSON.parse(props.getProperty('daily') || '{}');
  const count = saved.date === today ? saved.count : 0;
  if (count >= SETTINGS.DAILY_LIMIT) return false;
  props.setProperty('daily', JSON.stringify({ date: today, count: count + 1 }));
  return true;
}
