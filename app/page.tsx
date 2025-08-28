import HomeHeader from "@/src/components/page/home-header";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";

export default function Home() {
  return <>
    <PageHeader title="Dashboard" />
    <PageWrapper>
      <PageTitle backButton={{enabled: false}}>Dashboard</PageTitle>
      
    </PageWrapper>
  </>;
}
