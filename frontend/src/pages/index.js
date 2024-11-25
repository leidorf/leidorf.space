import Header from "@/components/layout/Header";
import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";

const HomePage = () => {
  return (
    <>
      <Layout>
        <PageHead></PageHead>

        <div className="flex justify-center">
          <div className="w-8/12">
            <p>
              hello my name is <span className="italic">güray dağ</span>.
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default HomePage;
