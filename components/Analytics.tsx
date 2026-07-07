import Script from "next/script";
import { GA_MEASUREMENT_ID, GTM_ID, GOOGLE_ADS_ID } from "@/lib/analytics";

export default function Analytics() {
  if (!GA_MEASUREMENT_ID && !GTM_ID) return null;

  return (
    <>
      {GTM_ID && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}
      {GA_MEASUREMENT_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
window.gtag = gtag;`}
          </Script>
        </>
      )}
    </>
  );
}
