import Link from "next/link";
import React from "react";
import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";

const About = () => {
  return (
    <>
      <Layout>
        <PageHead headTitle="about"></PageHead>
        <section className="flex justify-center">
          <div className="w-8/12 text-center my-4">
            <ul className="flex justify-center">
              <li>
                <Link
                  href="https://github.com/leidorf"
                  target="_blank"
                >
                  <img
                    alt="güray dağ"
                    style={{ width: "350px" }}
                    src="https://avatars.githubusercontent.com/u/93585259?v=4"
                  ></img>
                </Link>
                <p className="text-lg">
                  güray dağ <br />
                  (me)
                </p>
              </li>
            </ul>
            <p className="text-zinc-500 whitespace-pre-line mt-2">i am interested in cybersecurity.{"\n"}i love the concept of web, foss, most forms of art and anatolia.</p>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default About;
