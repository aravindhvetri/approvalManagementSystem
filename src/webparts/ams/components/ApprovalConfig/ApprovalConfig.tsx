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
  activeTabViewBar,
  getCategoryFunction,
  selectedCategory,
  ApprovalConfigSideBarVisible,
  setApprovalConfigSideBarContent,
  setApprovalConfigSideBarVisible,
}) => {
  return (
    <>
      <div className="tabViewContents">
        {activeTabViewBar == 2 ? (
          <CategoryConfig
            selectedCategory={selectedCategory}
            getCategoryFunction={getCategoryFunction}
            context={context}
            setCategorySideBarContent={setApprovalConfigSideBarContent}
            setCategorySideBarVisible={setApprovalConfigSideBarVisible}
            ApprovalConfigSideBarVisible={ApprovalConfigSideBarVisible}
          />
        ) : activeTabViewBar == 3 ? (
          <ApprovalDashboard
            ApprovalConfigSideBarVisible={ApprovalConfigSideBarVisible}
            setApprovalSideBarContent={setApprovalConfigSideBarContent}
            setApprovalSideBarVisible={setApprovalConfigSideBarVisible}
            context={context}
          />
        ) : activeTabViewBar == 4 ? (
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
