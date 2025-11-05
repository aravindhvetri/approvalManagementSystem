//Default Imports:
import * as React from "react";
import { useEffect, useState } from "react";

//Style Imports:
import "../../../External/style.css";
import mainStyles from "./MainComponent.module.scss";

//Common Service Imports
import { Config } from "../../../CommonServices/Config";

//Children's Components Imports:
import ProductSideNav from "./ProductNav/ProductSideNav";
import Header from "./HeaderComponent/Header";
import { sp } from "@pnp/sp";

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
      setCurrentPage(Config.sideNavPageNames.Request);
    }
    createGroup();
  };

  //Create SharePoint Group Function:
  const createGroup = async () => {
    try {
      const groupName = "RequestsAdmin";

      // Check if group already exists
      const groups = await sp.web.siteGroups.get();
      const exists = groups.some(
        (g) => g.Title.toLowerCase() === groupName.toLowerCase()
      );

      if (!exists) {
        await sp.web.siteGroups.add({
          Title: groupName,
          Description: "Dynamic group for Requests Admins",
        });
      } else {
        console.log(`Group '${groupName}' already exists.`);
      }
    } catch (err) {
      console.error("Error creating group:", err);
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
          {/* <div className={mainStyles.container_sidebar}>
            <ProductSideNav context={context} updatePage={updatePage} currentPage={currentPage} />
          </div> */}
          <div className={mainStyles.container_content}>
            <Header context={context} currentPage={currentPage} />
          </div>
        </div>
      </div>
    </>
  );
};

export default MainComponent;
