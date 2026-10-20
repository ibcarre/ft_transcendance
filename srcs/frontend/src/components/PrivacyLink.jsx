import { Link } from 'react-router';

export function PrivacyLink() {
    return (
        <Link
            to="/privacy"
            className="mt-[30px] mb-4 block text-center text-[13px] text-slate-400 transition-colors hover:text-blue-500">
            Privacy Policy & Terms Conditions
        </Link>
    );
}
