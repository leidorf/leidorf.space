import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import Link from "next/link";

const contact = () => {
  return (
    <>
      <Layout>
        <PageHead headTitle={`contact`}></PageHead>

        <div className="flex justify-center">
          <div className="w-8/12">
            <div className="mb-4">
              <p className="red-underline text-xl font-black">contact</p>
            </div>
            <div>
              <ul>
                <li>
                  <Link
                    href={`mailto:leidorf.foss@gmail.com?subject=Mail from website`}
                    target="_blank"
                  >
                    <span className="red-underline">(mail)</span> <span>leidorf.foss@gmail.com</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href={`https://github.com/leidorf`}
                    target="_blank"
                  >
                    <span className="red-underline">(github)</span> <span>leidorf</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default contact;
