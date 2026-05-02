/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                // StarClaim brand palette
                'sc-deep': '#050A1A',
                'sc-mid': '#0A1628',
                'sc-card': '#0F1F3D',
                'sc-gold': '#C9A84C',
                'sc-gold-light': '#E0BB6A',
                'sc-purple': '#7B5EA7',
                'sc-blue': '#4DA6FF',
                'sc-red': '#E24B4A',
                'sc-green': '#2DD4A0',
                'sc-text': '#F0F4FF',
                'sc-text-muted': '#8899BB',
            },
            fontFamily: {
                display: ['Cinzel', 'serif'],
                sans: ['"DM Sans"', 'sans-serif'],
                accent: ['"Cormorant Garamond"', 'serif'],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            keyframes: {
                'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
                'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
                twinkle: { '0%,100%': { opacity: '0.3' }, '50%': { opacity: '1' } },
                'fade-up': { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
                'marquee': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
                'pulse-gold': { '0%,100%': { boxShadow: '0 0 20px rgba(201,168,76,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(201,168,76,0.6)' } },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                twinkle: 'twinkle 3s ease-in-out infinite',
                'fade-up': 'fade-up 0.8s ease-out forwards',
                marquee: 'marquee 40s linear infinite',
                'pulse-gold': 'pulse-gold 2.5s ease-in-out infinite',
            },
            backgroundImage: {
                'nebula-radial': 'radial-gradient(circle at 20% 20%, rgba(123,94,167,0.15), transparent 60%), radial-gradient(circle at 80% 60%, rgba(77,166,255,0.1), transparent 60%)',
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
