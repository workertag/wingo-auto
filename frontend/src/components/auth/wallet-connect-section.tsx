import "@rainbow-me/rainbowkit/styles.css";
import { ConnectButton } from "@/components/connect-button";
import { RainbowKitSetup } from "@/providers/web3-provider";

export default function WalletConnectSection({
  referenceCode,
}: {
  referenceCode?: string;
}) {
  return (
    <RainbowKitSetup>
      <ConnectButton referenceCode={referenceCode} />
    </RainbowKitSetup>
  );
}
