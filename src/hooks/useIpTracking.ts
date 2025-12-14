// IP Tracking hook using ipify.org
export const getClientIpAddress = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
  } catch (error) {
    console.error('Error fetching IP address:', error);
  }
  return null;
};

export const getUserAgent = (): string => {
  return navigator.userAgent;
};

// Returns both IP and user agent
export const getTrackingInfo = async (): Promise<{ ip_address: string | null; user_agent: string }> => {
  const [ip_address] = await Promise.all([getClientIpAddress()]);
  return {
    ip_address,
    user_agent: getUserAgent(),
  };
};
