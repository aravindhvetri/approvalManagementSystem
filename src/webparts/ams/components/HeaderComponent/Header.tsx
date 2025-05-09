//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
//CommonService Imports:
import { Config } from "../../../../CommonServices/Config";
import {
  IBasicDropDown,
  IDropdownDetails,
  IRightSideBarContents,
  IUserDetails,
  ITabviewDetails,
  IBasicFilterCategoryDrop,
  IRightSideBarContentsDetails,
  ICardDetails,
  ICardDataCountDetails,
} from "../../../../CommonServices/interface";
import SPServices from "../../../../CommonServices/SPServices";
//Style Imports:
import { LuBadgePlus } from "react-icons/lu";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import {
  getSpGroupMembers,
  RightSidebar,
  showCard,
  tabViewBar,
} from "../../../../CommonServices/CommonTemplates";
import { Persona } from "office-ui-fabric-react";
import { IoMdNotificationsOutline } from "react-icons/io";
import "../../../../External/style.css";
import headerStyles from "./Header.module.scss";
import "./HeaderStyle.css";
//Children's component import
import DashboardPage from "../Dashboard/DashboardPage";
import { InputText } from "primereact/inputtext";
import ApprovalConfig from "../ApprovalConfig/ApprovalConfig";
//React icons imports:
import { FaChartBar } from "react-icons/fa";
import { FaRegClock } from "react-icons/fa";
import { SiTicktick } from "react-icons/si";
import { GiCancel } from "react-icons/gi";

const Header = ({ context, currentPage }) => {
  //UseStates
  const [categoryFilterValue, setCategoryFilterValue] =
    useState<IDropdownDetails>({ ...Config.initialConfigDrop });
  const [selectedCategory, setSelectedCategory] =
    useState<IBasicFilterCategoryDrop>();
  const [sideBarVisible, setSideBarVisible] = useState<boolean>(false);
  const [sideBarcontent, setSideBarContent] = useState<IRightSideBarContents>({
    ...Config.rightSideBarContents,
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const loginUser = context._pageContext._user.email;
  const [activeTabViewBar, setActiveTabViewBar] = useState(0);
  const [globelSearchValue, setGlobelSearchValue] = useState<string>("");
  const userDetails: IUserDetails = {
    name: context._pageContext._user.displayName,
    email: context._pageContext._user.email,
  };
  const [addSideBarContentBooleans, setAddSideBarContentBooleans] =
    useState<IRightSideBarContentsDetails>({
      ...Config.rightSideBarContentsDetails,
    });
  const [activeTabView, setActiveTabView] = useState(0);
  const [currentTableData, setCurrentTableData] = useState([]);
  const [cardDataCountDetails, setCardDataCountDetails] = useState<
    ICardDataCountDetails[]
  >([Config.cardDataCountDetailsConfig]);

  //Get Category From List
  const categoryFilter = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.CategoryConfig,
      Select: "*",
      Orderby: "Modified",
      Orderbydecorasc: false,
      Filter: [
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
        {
          FilterKey: "IsDraft",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
    })
      .then((res: any) => {
        const TempArr: IBasicFilterCategoryDrop[] = [];
        res?.forEach((item: any) => {
          TempArr.push({ name: item.Category, id: item.ID });
        });
        setCategoryFilterValue((prev: IDropdownDetails) => ({
          ...prev,
          categoryDrop: TempArr,
        }));
      })
      .catch((e) => {
        console.log("Get Category Error", e);
      });
  };

  // Sitebar open
  const openSidebar = async () => {
    if (activeTabViewBar === 0) {
      setAddSideBarContentBooleans((prev: IRightSideBarContentsDetails) => ({
        ...prev,
        addRequestDetails: true,
      }));
    }
    setSideBarVisible(true);
  };

  //Set Card Details Count
  const setCardCounts = async () => {
    const tempTotalRequestCount: number = currentTableData?.length;
    const tempPendingRequestCount: number = currentTableData?.filter(
      (e) => e?.status === "Pending"
    ).length;
    const tempApprovedRequestCount: number = currentTableData?.filter(
      (e) => e?.status === "Approved"
    ).length;
    const tempRejecetedRequestCount: number = currentTableData?.filter(
      (e) => e?.status === "Rejected"
    ).length;
    const tempArr = [
      {
        name: "Total Requests",
        count: tempTotalRequestCount,
        icon: <FaChartBar />,
      },
      {
        name: "Pending Requests",
        count: tempPendingRequestCount,
        icon: <FaRegClock />,
      },
      {
        name: "Approved Requests",
        count: tempApprovedRequestCount,
        icon: <SiTicktick />,
      },
      {
        name: "Rejected Requests",
        count: tempRejecetedRequestCount,
        icon: <GiCancel />,
      },
    ];
    await setCardDataCountDetails([...tempArr]);
  };

  //Set TabView Content
  const declareTabViewBar = () => {
    const TemptabContent: ITabviewDetails[] = [
      {
        id: 1,
        name: "My Request",
      },
      {
        id: 2,
        name: "My Approval",
      },
    ];

    if (isAdmin) {
      TemptabContent.push(
        // {
        //   id: 1,
        //   name: "All Request",
        // },
        // {
        //   id: 4,
        //   name: "Workflows",
        // }
        {
          id: 3,
          name: "Custom Workflows",
        },
        {
          id: 4,
          name: "Approval Config",
        },
        {
          id: 5,
          name: "Email Config",
        }
      );
    }
    const tempTabView = tabViewBar(
      TemptabContent,
      activeTabViewBar,
      setActiveTabViewBar
    );
    return <>{tempTabView}</>;
  };

  //Workflows tab view bar
  const workFlowsTabViewBar = () => {
    const TempApproveConfigTabContent: ITabviewDetails[] = [
      {
        id: 1,
        name: "Category",
      },
      {
        id: 2,
        name: "Approval Workflow",
      },
      {
        id: 3,
        name: "Email Workflow",
      },
    ];

    const tempApproveConfigTabView = tabViewBar(
      TempApproveConfigTabContent,
      activeTabView,
      setActiveTabView
    );
    return <>{tempApproveConfigTabView}</>;
  };

  // Header Filters
  const headerFilters = () => {
    return (
      <>
        {/* {(activeTabViewBar === 2 || activeTabViewBar === 0) && (
          <Dropdown
            value={selectedCategory}
            options={categoryFilterValue.categoryDrop}
            onChange={(e) => {
              setSelectedCategory(e.value);
            }}
            showClear
            filter
            optionLabel="name"
            placeholder="Category"
            className="w-full md:w-14rem"
          />
        )} */}
        {isAdmin && (
          <div className="addNewCustomWorkflowButton">
            <Button
              onClick={() => {
                setSideBarVisible(true);
                setActiveTabViewBar(2);
              }}
              label="Create Custom Workflow"
              // icon={<LuBadgePlus />}
            />
          </div>
        )}

        <div className="addNewRequestButton">
          <Button
            onClick={() => {
              setAddSideBarContentBooleans(
                (prev: IRightSideBarContentsDetails) => ({
                  ...prev,
                  addRequestDetails: true,
                })
              );
              setSideBarVisible(true);
              setActiveTabViewBar(0);
            }}
            label="New Request"
            // icon={<LuBadgePlus />}
          />
        </div>
        {/* {activeTabViewBar !== 1 && (
          <div className="addNewButton">
            <Button
              label="Add new"
              onClick={async () => {
                openSidebar();
              }}
              icon={<LuBadgePlus />}
            />
          </div>
        )} */}
        {/* {activeTabViewBar === 1 && (
          <div className={headerStyles.searchFilter}>
            <InputText
              style={{ width: "100%" }}
              type="Search"
              value={globelSearchValue}
              placeholder="Search here..."
              onChange={(e) => setGlobelSearchValue(e.target.value)}
            />
          </div>
        )} */}
      </>
    );
  };

  //useEffect
  useEffect(() => {
    categoryFilter();
    declareTabViewBar();
    // workFlowsTabViewBar();
    getSpGroupMembers(Config.spGroupNames.RequestsAdmin).then(async (res) => {
      if (res?.some((e) => e?.email === loginUser)) {
        await setIsAdmin(true);
      } else {
        false;
      }
    });
  }, []);
  useEffect(() => {
    setGlobelSearchValue("");
    setSelectedCategory(undefined);
    headerFilters();
  }, [activeTabViewBar, currentPage]);
  useEffect(() => {
    if (!sideBarVisible) {
      setAddSideBarContentBooleans({ ...Config.rightSideBarContentsDetails });
    }
  }, [sideBarVisible]);
  useEffect(() => {
    setCardCounts();
  }, [currentTableData]);

  return (
    <>
      <div className="headerContainer">
        <div className={headerStyles.profile_header_container}>
          <div className={headerStyles.profile_header_content}>
            <h1
              style={{
                fontSize: "1.875rem",
                lineHeight: "2.25rem",
              }}
            >
              Approval Hub
            </h1>
            <p>Manage and track approval workflows across your organization</p>
          </div>

          <div className={headerStyles.profile_header_Icons}>
            {/* <div className={headerStyles.notifyBell}>
              <IoMdNotificationsOutline />
            </div>
            <Persona
              imageUrl={`/_layouts/15/userphoto.aspx?size=S&username=${userDetails.email}`}
            /> */}
            {headerFilters()}
          </div>
        </div>
        {(activeTabViewBar === 1 || activeTabViewBar === 0) && (
          <div className={headerStyles.cardDetails_container}>
            {cardDataCountDetails?.map((e) =>
              showCard({
                cardTitle: e?.name,
                cardContent: e?.count.toString(),
                icon: e?.icon,
              })
            )}
          </div>
        )}

        <div className={headerStyles.filter_header_container}>
          <div className={headerStyles.filter_header_pageName}>
            {declareTabViewBar()}
          </div>

          <RightSidebar
            visible={sideBarVisible}
            onHide={() => {
              setSideBarVisible(false);
            }}
            contents={
              activeTabViewBar === 2
                ? sideBarcontent?.categoryConfigContent
                : activeTabViewBar === 0 || activeTabViewBar === 1
                ? addSideBarContentBooleans?.addRequestDetails &&
                  activeTabViewBar === 0
                  ? sideBarcontent?.AddRequestsDashBoardContent
                  : sideBarcontent?.RequestsDashBoardContent
                : activeTabViewBar === 3
                ? sideBarcontent?.ApprovalConfigContent
                : activeTabViewBar === 4
                ? sideBarcontent?.EmailWorkFlowContent
                : ""
            }
          ></RightSidebar>
        </div>
        {/* <div className={headerStyles.filter_header_pageName}>
          {activeTabViewBar === 3 && workFlowsTabViewBar()}
        </div> */}
      </div>
      <div>
        {activeTabViewBar === 0 || activeTabViewBar === 1 ? (
          <>
            <DashboardPage
              setCurrentTableDataForDataCard={setCurrentTableData}
              categoryFilterValue={categoryFilterValue}
              activeTabViewBar={activeTabViewBar}
              addRequest={addSideBarContentBooleans?.addRequestDetails}
              globelSearchValue={globelSearchValue}
              selectedCategory={selectedCategory}
              sideBarVisible={sideBarVisible}
              context={context}
              setRequestsDashBoardContent={setSideBarContent}
              setDynamicRequestsSideBarVisible={setSideBarVisible}
            />
          </>
        ) : activeTabViewBar !== 0 && activeTabViewBar !== 1 ? (
          <ApprovalConfig
            context={context}
            getCategoryFunction={categoryFilter}
            selectedCategory={selectedCategory}
            ApprovalConfigSideBarVisible={sideBarVisible}
            activeTabViewBar={activeTabViewBar}
            setApprovalConfigSideBarContent={setSideBarContent}
            setApprovalConfigSideBarVisible={setSideBarVisible}
          />
        ) : (
          ""
        )}
      </div>
    </>
  );
};

export default Header;
