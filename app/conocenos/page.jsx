import ConocenosBody from "./conocenos-body";

export const metadata = {
  title: "Conócenos | Tripoli Media",
};

export default function ConocenosPage() {
  return <ConocenosBody />;
}

export const revalidate = false;
