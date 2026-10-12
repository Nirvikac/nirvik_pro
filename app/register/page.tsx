import { redirect } from "next/navigation";

// The register form now lives on the homepage (nirvikacharya.com.np/).
export default function RegisterPage() {
  redirect("/");
}
