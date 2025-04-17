//Default Imports:
import * as React from "react";
import { useEffect, useState } from "react";
//Styles Imports:
import sideNavStyles from "./ProductSideNav.module.scss";
//CommonService Imports:
import { ISideNavDetails } from "../../../../CommonServices/interface";
import { Config } from "../../../../CommonServices/Config";
//Fluentui Imports:
import { TooltipHost } from "@fluentui/react";
import { getSpGroupMembers } from "../../../../CommonServices/CommonTemplates";

const ProductSideNav = ({ context, updatePage, currentPage }) => {
  //Image Variables:
  const sampleImg: any = require("../../../../External/sidenavImages/sampleImg.png");
  const sampleImgBlue: any = require("../../../../External/sidenavImages/sampleImgBlue.png");
  const companyLogo: any = require("../../../../External/sidenavImages/imageCompanyLogo.png");
  const requestImgDark: any = require("../../../../External/sidenavImages/requestDark.png");
  const requestImgLight: any = require("../../../../External/sidenavImages/requestLight.png");
  const approvalImgDark: any = require("../../../../External/sidenavImages/approvalDark.png");
  const approvalImgLight: any = require("../../../../External/sidenavImages/approvalLight.png");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const loginUser = context._pageContext._user.email;

  //Get SideNav Details:
  const sideNavContents: ISideNavDetails[] = [
    {
      img:
        currentPage === Config.sideNavPageNames.Request
          ? requestImgLight
          : requestImgDark,
      name: "Request",
      pageName: Config.sideNavPageNames.Request,
    },
  ];
  if (isAdmin) {
    sideNavContents.push({
      img:
        currentPage === Config.sideNavPageNames.ApproveConfig
          ? approvalImgLight
          : approvalImgDark,
      name: "Approval config",
      pageName: Config.sideNavPageNames.ApproveConfig,
    });
  }
  console.log("sideNavContents", sideNavContents);

  //SetPagename :
  const updatePageUrl = (pageName: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("Page", pageName);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}${
      window.location.hash
    }`;
    history.pushState(null, "", newUrl);
    updatePage(pageName);
  };

  useEffect(() => {
    getSpGroupMembers(Config.spGroupNames.RequestsAdmin).then(async (res) => {
      if (res?.some((e) => e?.email === loginUser)) {
        await setIsAdmin(true);
      } else {
        false;
      }
    });
  }, []);

  return (
    <>
      <div className={sideNavStyles.companyLogoStyle}>
        <img src={companyLogo}></img>
      </div>
      <div>
        {sideNavContents?.map((contents, index) => {
          return (
            <div key={index}>
              <TooltipHost
                content={contents.name}
                calloutProps={{ gapSpace: 0 }}
              >
                <div
                  onClick={() => {
                    updatePageUrl(contents.pageName);
                  }}
                  className={
                    contents?.pageName === currentPage
                      ? sideNavStyles.navButtonActiveContainer
                      : sideNavStyles.navButtonInactiveContainer
                  }
                >
                  <div className={sideNavStyles.iconSection}>
                    <img src={contents?.img}></img>
                  </div>
                  <div className={sideNavStyles.labelSection}>
                    {contents?.name}
                  </div>
                </div>
              </TooltipHost>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ProductSideNav;
