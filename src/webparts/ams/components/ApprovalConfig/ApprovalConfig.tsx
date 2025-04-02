//Default Imports:
import * as React from "react";
import { useState, useEffect } from "react";
//Styles Imports:
import "../../../../External/style.css";
//CommonService Imports:
import { ITabviewDetails } from "../../../../CommonServices/interface";
import { tabViewBar } from "../../../../CommonServices/CommonTemplates";
import CategoryConfig from "../Admin/CategoryConfig/CategoryConfig";
import ApprovalWorkFlow from "../Admin/ApprovalWorkFlow/ApprovalWorkFlow";
import EmailWorkFlow from "../Admin/EmailWorkFlow/EmailWorkFlow";
import ApprovalDashboard from "../Admin/ApprovalWorkFlow/ApprovalDashboard";

const ApprovalConfig = ({
  context,
  setTabView,
  ApprovalConfigSideBarVisible,
  setApprovalConfigSideBarContent,
  setApprovalConfigSideBarVisible,
}) => {
  return (
    <>
      <div className="tabViewContents">
        {setTabView == 0 ? (
          <CategoryConfig
            context={context}
            setCategorySideBarContent={setApprovalConfigSideBarContent}
            setCategorySideBarVisible={setApprovalConfigSideBarVisible}
          />
        ) : setTabView == 1 ? (
          <ApprovalDashboard
            ApprovalConfigSideBarVisible={ApprovalConfigSideBarVisible}
            setApprovalSideBarContent={setApprovalConfigSideBarContent}
            setApprovalSideBarVisible={setApprovalConfigSideBarVisible}
            context={context}
          />
        ) : setTabView == 2 ? (
          <EmailWorkFlow
            setEmailWorkFlowSideBarContent={setApprovalConfigSideBarContent}
            setEmailWorkFlowSideBarVisible={setApprovalConfigSideBarVisible}
          />
        ) : (
          ""
        )}
      </div>
    </>
  );
};

export default ApprovalConfig;
