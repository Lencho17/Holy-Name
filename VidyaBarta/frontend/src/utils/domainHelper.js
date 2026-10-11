// Utility to detect domain and branding context for VidyaBarta & PayPupil

export function getEffectiveHostname() {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const urlParams = new URLSearchParams(window.location.search);
  const storedTestDomain = typeof localStorage !== 'undefined' ? localStorage.getItem('test_domain') : null;
  const testDomain = urlParams.get('test_domain') || storedTestDomain;
  
  if (isLocalhost && testDomain) {
    return testDomain;
  }
  return hostname;
}

export function isPayPupilDomain() {
  const host = getEffectiveHostname();
  return (
    host === 'paypupil.in' ||
    host === 'www.paypupil.in' ||
    host === 'app.paypupil.in' ||
    host.endsWith('.paypupil.in')
  );
}

export function isAppSubdomain() {
  const host = getEffectiveHostname();
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return (
    host === 'app.vidyabarta.com' ||
    urlParams.get('site') === 'app'
  );
}

export function getBrandName() {
  return 'VidyaBarta';
}

export function getCentralLoginUrl() {
  if (isPayPupilDomain()) {
    return 'https://www.paypupil.in/login';
  }
  return 'https://www.vidyabarta.com/login';
}

export function getCentralStaffSignupUrl() {
  if (isPayPupilDomain()) {
    return 'https://www.paypupil.in/staff-signup';
  }
  return 'https://www.vidyabarta.com/staff-signup';
}
