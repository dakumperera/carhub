
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental : {
serverComponentsHmrCache: false, //default to true
    },

    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "rtqvhekraharznqtxglw.supabase.co",
            },
        ],
    },

    async headers() {
        return [
            {
                source: "/embed",
                headers: [
                    {
                        key: "content-security-policy", // Changed to lowercase
                        value: "frame-src 'self' https://carhub-waitlist.created.app", // Changed to lowercase
                    },
                ],
            },
        ];
    },
};

export default nextConfig;