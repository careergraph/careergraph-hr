import { GoogleLogin } from "@react-oauth/google";

interface GoogleAuthProps {
  onSuccess: (idToken: string) => void;
  onError?: () => void;
  onStart?: () => void;
  disabled?: boolean;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({
  onSuccess,
  onError,
  onStart,
  disabled = false,
  text = "signin_with",
}) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isClientIdValid =
    typeof clientId === "string" &&
    clientId.trim().length > 0 &&
    clientId.includes(".apps.googleusercontent.com");

  if (!isClientIdValid) {
    return null;
  }

  return (
    <div
      className={disabled ? "pointer-events-none opacity-60" : undefined}
      aria-disabled={disabled}
    >
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            onSuccess(credentialResponse.credential);
            return;
          }

          onError?.();
        }}
        onError={onError}
        click_listener={() => {
          if (!disabled) {
            onStart?.();
          }
        }}
        text={text}
        shape="rectangular"
        width="200"
      />
    </div>
  );
};

export default GoogleAuth;
