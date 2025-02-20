//Default Imports:
import * as React from "react";
import { useEffect, useState } from "react";

//Style Imports:
import "../../../External/style.css";
import mainStyles from "./MainComponent.module.scss";

//Children's Components Imports:
import ProductSideNav from "./ProductNav/ProductSideNav";
import Header from "./HeaderComponent/Header";

const MainComponent = ({ context }) => {
  //PageSwitch State:
  const [currentPage, setCurrentPage] = useState<string>("");
  //Handle page Function using URL params:
  const setPageFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageName = urlParams.get("Page");
    if (pageName) {
      setCurrentPage(pageName);
    } else {
      setCurrentPage("Request");
    }
  };
  //get and set the page Name (using Props):
  const updatePage = (page: string) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setPageFromUrl();
  }, []);

  return (
    <>
      <div className={mainStyles.page}>
        <div className={mainStyles.container}>
          <div className={mainStyles.container_sidebar}>
            <ProductSideNav updatePage={updatePage} currentPage={currentPage} />
          </div>
          <div className={mainStyles.container_content}>
            <Header currentPage={currentPage} />
          </div>
        </div>
      </div>
    </>
  );
};

export default MainComponent;
