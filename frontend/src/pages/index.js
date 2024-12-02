import Header from "@/components/layout/Header";
import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import Link from "next/link";

const HomePage = () => {
  return (
    <>
      <Layout>
        <PageHead></PageHead>

        <div className="flex justify-center">
          <div className="w-8/12">
            <p>
              hello, i am{" "}
              <i>
                <strong>leidorf</strong>
              </i>
              .
            </p>
            <p className="text-pretty w-1/2 my-2">
              i love the concept of internet, free and open source software and most form of art. even though I enjoy a variety
              of subjects, I generally enjoy producing things. time to time i make visual works (
              <i>pixel-art, glitch-art, digital-art, photography, ...</i>) and writings (<i>stories, poems</i>) and this site was
              created to serve as a repository for the{" "}
              <Link
                className="text-red-600 hover:text-red-800"
                href={"/works"}
              >
                works
              </Link>{" "}
              I make and want to share. you can access the source codes of the site from{" "}
              <Link
                className="text-red-600 hover:text-red-800"
                target="_blank"
                href={`https://github.com/leidorf/leidorf.space`}
              >
                here
              </Link>
              .
            </p>
            <p>
              also you can contact me from{" "}
              <Link
                className="text-red-600 hover:text-red-800"
                href={`/contact`}
              >
                here
              </Link>
              , if you want.
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default HomePage;
