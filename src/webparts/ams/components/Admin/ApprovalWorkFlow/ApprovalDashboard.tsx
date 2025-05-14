import * as React from "react";
import { useState, useEffect } from "react";
//Styles import
import "../../../../../External/commonStyles.module.scss";
import "../../../../../External/style.css";
//Common Service imports
import SPServices from "../../../../../CommonServices/SPServices";
import { Config } from "../../../../../CommonServices/Config";
import {
  ActionsMenu,
  multiplePeoplePickerTemplate,
  peoplePickerTemplate,
  statusTemplate,
} from "../../../../../CommonServices/CommonTemplates";
import {
  IApprovalConfigDetails,
  IApprovalStages,
  IPeoplePickerDetails,
} from "../../../../../CommonServices/interface";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ApprovalWorkFlow from "./ApprovalWorkFlow";
import Loader from "../../Loader/Loader";
//PrimeReact imports:
import { Button } from "primereact/button";
import { LuWorkflow } from "react-icons/lu";
import { LuBadgePlus } from "react-icons/lu";

const ApprovalDashboard = ({
  setApprovalSideBarContent,
  ApprovalConfigSideBarVisible,
  setApprovalSideBarVisible,
  context,
}) => {
  //useStates
  const [approvalConfigDetails, setApprovalConfigDetails] = useState<
    IApprovalConfigDetails[]
  >([]);
  const [isEdit, setIsEdit] = useState<boolean>(true);
  const [currentRecord, setCurrentRecord] = useState<IApprovalConfigDetails>();
  const [showLoader, setShowLoader] = useState<boolean>(true);
  const [usedCategories, setUsedCategories] = useState([]);
  //Get Category Details
  const getCategoryDetails = async (ItemID) => {
    try {
      const res: any = await SPServices.SPReadItemUsingId({
        Listname: Config.ListNames.ApprovalConfig,
        Select: "*,Category/Id,Category/Category",
        Expand: "Category",
        SelectedId: ItemID,
      });
      const tempCategoryArr = [];
      res?.Category.forEach((element: any) => {
        tempCategoryArr.push(element?.Category);
        setUsedCategories([...tempCategoryArr]);
      });
    } catch {
      (err) => console.log("getCategoryDetails err", err);
    }
  };
  //Set Actions PopUp:
  const actionsWithIcons = (rowData) => [
    {
      label: "View",
      icon: "pi pi-eye",
      className: "customView",
      command: async () => {
        const currentRec = approvalConfigDetails?.find(
          (rec) => rec?.id === rowData?.id
        );
        await setCurrentRecord(currentRec);
        await setIsEdit(false);
        setApprovalSideBarVisible(true);
      },
    },
    {
      label: "Edit",
      icon: "pi pi-file-edit",
      className: "customEdit",
      command: async () => {
        const currentRec = approvalConfigDetails?.find(
          (rec) => rec?.id === rowData?.id
        );
        await setCurrentRecord(currentRec);
        await setIsEdit(true);
        await getCategoryDetails(rowData?.id);
        setApprovalSideBarVisible(true);
      },
    },
    {
      label: "Delete",
      icon: "pi pi-trash",
      className: "customDelete",
      command: () => {
        updateIsDelete(rowData?.id);
      },
    },
  ];

  //Get ApprovalConfig List Details
  const getApprovalConfig = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.ApprovalConfig,
      Select: "*,Category/Id,Category/Category",
      Expand: "Category",
      Filter: [
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
      Orderby: "Id",
      Orderbydecorasc: false,
    })
      .then(async (res) => {
        const tempArr: IApprovalConfigDetails[] = [];
        await res?.forEach(async (item: any) => {
          tempArr.push({
            id: item?.ID,
            category: item?.CategoryId,
            categoryName: item?.Category,
            apprvalFlowName: item?.ApprovalFlowName,
            totalStages: item?.TotalStages,
            rejectionFlow: item?.RejectionFlow,
            stages: await getApprovalStageConfig(item?.ID),
          });
          setApprovalConfigDetails([...tempArr]);
        });
        setShowLoader(false);
      })
      .catch((err) => {
        console.log("getApprovalConfig", err);
        setShowLoader(false);
      });
  };

  //get Approval Stage Config
  const getApprovalStageConfig = async (parentID) => {
    try {
      const res = await SPServices.SPReadItems({
        Listname: Config.ListNames.ApprovalStageConfig,
        Select: "*,ParentApproval/Id,Approver/Id,Approver/EMail,Approver/Title",
        Expand: "ParentApproval,Approver",
        Filter: [
          {
            FilterKey: "ParentApprovalId",
            Operator: "eq",
            FilterValue: parentID.toString(),
          },
        ],
        Orderby: "Stage",
        Orderbydecorasc: true,
      });
      const tempStageArr: IApprovalStages[] = [];
      res?.forEach((item: any) => {
        tempStageArr.push({
          stage: item?.Stage,
          approvalProcess: item?.ApprovalProcess,
          approver: item?.Approver.map((e) => ({
            id: e?.Id,
            email: e?.EMail,
            name: e?.Title,
          })),
        });
      });
      return tempStageArr;
    } catch {
      (err) => console.log("getApprovalStageConfig error", err);
    }
  };

  //IsDelete update in Approval config
  const updateIsDelete = (ItemId) => {
    SPServices.SPUpdateItem({
      Listname: Config.ListNames.ApprovalConfig,
      ID: ItemId,
      RequestJSON: { IsDelete: true },
    })
      .then(() => getApprovalConfig())
      .catch((err) => console.log("updateIsDelete error", err));
  };

  //Rejection Type
  const renderRejectionFlowColumn = (rowData) => {
    return <div>{statusTemplate(rowData?.rejectionFlow)}</div>;
  };

  //Render Category Name:
  const renderCategoryName = (rowData) => {
    return (
      <div className="categoryName">
        {rowData?.categoryName?.length > 0 && (
          <>
            Linked categories for this approval -
            {rowData.categoryName.map((e, index) => (
              <div key={index} className="categoryTag">
                {e?.Category}
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  //Render Approvers column
  const renderApproversColumn = (rowData) => {
    const approvers: IPeoplePickerDetails[] = rowData?.stages.flatMap((e) =>
      e?.approver.map((approver) => ({
        id: approver?.id,
        name: approver?.name,
        email: approver?.email,
      }))
    );
    return (
      <div>
        {approvers.length > 1
          ? multiplePeoplePickerTemplate(approvers)
          : peoplePickerTemplate(approvers[0])}
      </div>
    );
  };
  //Render Action column
  const renderActionColumn = (rowData) => {
    const menuModel = actionsWithIcons(rowData); // rowData pass panrom da
    return <ActionsMenu items={menuModel} />;
  };

  useEffect(() => {
    getApprovalConfig();
  }, []);

  return (
    <>
      <ApprovalWorkFlow
        currentRec={currentRecord}
        isEdit={isEdit}
        usedCategories={usedCategories}
        setIsEdit={setIsEdit}
        setCurrentRecord={setCurrentRecord}
        approvalTableRender={getApprovalConfig}
        ApprovalConfigSideBarVisible={ApprovalConfigSideBarVisible}
        setApprovalSideBarContent={setApprovalSideBarContent}
        setApprovalSideBarVisible={setApprovalSideBarVisible}
        context={context}
      />
      {showLoader ? (
        <Loader />
      ) : (
        <>
          {/* <div className="customDataTableContainer">
            <DataTable
              paginator
              rows={5}
              value={approvalConfigDetails}
              tableStyle={{ minWidth: "50rem" }}
              emptyMessage={
                <>
                  <p style={{ textAlign: "center" }}>No Records Found</p>
                </>
              }
            >
              <Column field="apprvalFlowName" header="name"></Column>
              <Column
                field="stages"
                header="Approvers"
                body={renderApproversColumn}
              ></Column>
              <Column
                field="rejectionFlow"
                body={renderRejectionFlowColumn}
                style={{ width: "15rem" }}
                header="Rejection flow"
              ></Column>
              <Column field="Action" body={renderActionColumn}></Column>
            </DataTable>
          </div> */}
          <div className="customDataTableCardContainer">
            <div className="profile_header_content">
              <div>
                <h2
                  style={{
                    lineHeight: "2.25rem",
                  }}
                >
                  Approval Config
                </h2>
                <p>
                  Configure approval stages and rules for processing requests
                </p>
              </div>
              <div className="addNewButton">
                <Button
                  label="Add New"
                  onClick={async () => {
                    setApprovalSideBarVisible(true);
                  }}
                  icon={<LuBadgePlus />}
                />
              </div>
            </div>
            <DataTable
              value={approvalConfigDetails}
              paginator
              rows={2}
              className="custom-card-table"
              emptyMessage={
                <p style={{ textAlign: "center" }}>No Records Found</p>
              }
            >
              <Column
                body={(rowData) => (
                  <div className="requestCard">
                    <div className="requestCardHeader">
                      <div className="requestId">
                        <h3 className="requestIdTitle">
                          <LuWorkflow style={{ fontSize: "24px" }} />
                          {rowData.apprvalFlowName}
                        </h3>
                        <span>{renderRejectionFlowColumn(rowData)}</span>
                      </div>
                      <div className="requestIdDetails">
                        <p className="requestIdpara">
                          Total Stages - {rowData?.totalStages}
                        </p>
                      </div>
                      {renderCategoryName(rowData)}
                    </div>
                    <div className="requestCardBody">
                      {renderApproversColumn(rowData)}
                      {renderActionColumn(rowData)}
                    </div>
                  </div>
                )}
              />
            </DataTable>
          </div>
        </>
      )}
    </>
  );
};

export default ApprovalDashboard;
