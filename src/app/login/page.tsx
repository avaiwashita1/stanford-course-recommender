import { GoogleSignInButton } from "./GoogleSignInButton";

const ERRORS: Record<string, string> = {
  domain_not_allowed: "Please sign in with your @stanford.edu Google account.",
  sign_in_failed: "Sign-in failed. Please try again.",
  missing_code: "Sign-in was interrupted. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Course Recommender</h1>
          <p className="text-sm text-gray-600">
            Personalized, prerequisite-checked Stanford course recommendations.
          </p>
        </div>
        {message && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{message}</p>
        )}
        <GoogleSignInButton />
      </div>
    </main>
  );
}
