import * as React from "react";
import { useState, useEffect } from "react";
//Styles import
import "../../../../../External/commonStyles.module.scss";
import "../../../../../External/style.css";
import approvalWorkFlowStyles from "./ApprovalWorkFlow.module.scss";
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
  IDelModal,
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
import { Dialog } from "primereact/dialog";
import { RiDeleteBinLine } from "react-icons/ri";
import { Label } from "office-ui-fabric-react";
import { InputText } from "primereact/inputtext";

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
  const [delModal, setDelModal] = useState<IDelModal>({
    ...Config.initialdelModal,
  });
  const [searchTerm, setSearchTerm] = useState("");
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
      // command: () => {
      //   updateIsDelete(rowData?.id);
      // },
      command: () => setDelModal({ isOpen: true, id: rowData?.id }),
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
      Orderby: "Modified",
      Orderbydecorasc: true,
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
  const updateIsDelete = () => {
    SPServices.SPUpdateItem({
      Listname: Config.ListNames.ApprovalConfig,
      ID: delModal.id,
      RequestJSON: { IsDelete: true },
    })
      .then(() => {
        getApprovalConfig();
        setDelModal({ isOpen: false, id: null });
      })
      .catch((err) => console.log("updateIsDelete error", err));
  };

  //Rejection Type
  const renderRejectionFlowColumn = (rowData) => {
    return <div>{statusTemplate(rowData?.rejectionFlow)}</div>;
  };

  //Render Category Name:
  const renderCategoryName = (rowData) => {
    return (
      <>
        {rowData?.categoryName?.length > 0 && (
          <Label className={approvalWorkFlowStyles.categoryLabel}>
            Linked categories for this approval :
          </Label>
        )}
        <div className="categoryName">
          {rowData?.categoryName?.length > 0 && (
            <>
              {rowData.categoryName.map((e, index) => (
                <div key={index} className="categoryTag">
                  {e?.Category}
                </div>
              ))}
            </>
          )}
        </div>
      </>
    );
  };

  //Render Approvers column
  const renderApproversColumn = (rowData) => {
    const approvers: IPeoplePickerDetails[] = rowData?.stages?.flatMap((e) =>
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
    const menuModel = actionsWithIcons(rowData);
    return <ActionsMenu items={menuModel} />;
  };

  //Filter records based on searchTerm
  const filteredApprovalConfigs = approvalConfigDetails.filter((item: any) => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();

    const searchableString = [
      item?.apprvalFlowName,
      item?.rejectionFlow,
      item?.totalStages?.toString(),
      ...(item?.categoryName?.map((e: any) => e?.Category) || []),
      ...(item?.stages?.flatMap((stage: any) =>
        stage?.approver?.map((appr: any) => `${appr?.name} ${appr?.email}`)
      ) || []),
    ]
      .filter(Boolean) // remove undefined/null
      .join(" ") // join everything into one string
      .toLowerCase();

    return searchableString.includes(lowerSearch);
  });

  useEffect(() => {
    getApprovalConfig();
  }, []);

  return (
    <>
      <ApprovalWorkFlow
        currentRec={currentRecord}
        isEdit={isEdit}
        usedCategories={usedCategories}
        setUsedCategories={setUsedCategories}
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
          <div className="customDataTableCardContainer">
            <div
              style={{
                borderBottom: "none",
                paddingBottom: "0px",
                marginBottom: "25px",
              }}
              className="profile_header_content"
            >
              <div>
                <span>Approval config</span>
                <p>
                  Configure approval stages and rules for processing requests
                </p>
              </div>
              <div className={approvalWorkFlowStyles.searchContainer}>
                <div className={approvalWorkFlowStyles.searchInput}>
                  <InputText
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search approval configurations"
                  />
                </div>
                <div style={{ width: "30%" }} className="addNewButton">
                  <Button
                    label="Add new"
                    onClick={async () => {
                      setApprovalSideBarVisible(true);
                    }}
                    icon={<LuBadgePlus />}
                  />
                </div>
              </div>
            </div>
            <div className="allRecords">
              <span style={{ fontFamily: "interSemiBold" }}>All records</span>
            </div>
            <div className="dashboardDataTable">
              <DataTable
                value={filteredApprovalConfigs}
                paginator={
                  filteredApprovalConfigs && filteredApprovalConfigs?.length > 0
                }
                rows={3}
                className="custom-card-table"
                emptyMessage={
                  <p className="NoDatas" style={{ textAlign: "center" }}>
                    No Records Found
                  </p>
                }
              >
                <Column
                  body={(rowData) => (
                    <div className="requestCard">
                      <div className="requestCardHeader">
                        <div
                          style={{ paddingBottom: "4px" }}
                          className="requestId"
                        >
                          <h3 className="requestIdTitle">
                            <LuWorkflow style={{ fontSize: "18px" }} />
                            {rowData.apprvalFlowName}
                          </h3>
                        </div>
                        {renderCategoryName(rowData)}
                      </div>
                      <div className="requestCardBody">
                        <div className="requestIdDetails">
                          <p className="requestIdpara">
                            Total stages{" "}
                            <span
                              className={approvalWorkFlowStyles.totalStages}
                            >
                              {(rowData?.totalStages)
                                .toString()
                                .padStart(2, "0")}
                            </span>
                          </p>
                        </div>
                        <span>{renderRejectionFlowColumn(rowData)}</span>
                        {renderApproversColumn(rowData)}
                        {renderActionColumn(rowData)}
                      </div>
                    </div>
                  )}
                />
              </DataTable>
            </div>
          </div>
        </>
      )}
      <Dialog
        className="modal-template confirmation"
        draggable={false}
        blockScroll={false}
        resizable={false}
        visible={delModal.isOpen}
        style={{ width: "20rem" }}
        onHide={() => {
          setDelModal({ isOpen: false, id: null });
        }}
      >
        <div className="modal-container">
          <div className="modalIconContainer">
            <RiDeleteBinLine />
          </div>
          <div className="modal-content">
            <div>
              <div className="modal-header">
                <h4>Confirmation</h4>
              </div>
              <p>Are you sure, you want to delete this approval process?</p>
            </div>
          </div>
          <div className="modal-btn-section">
            <Button
              label="No"
              className={`cancel-btn`}
              onClick={() => {
                setDelModal({ isOpen: false, id: null });
              }}
            />
            <Button
              className={`submit-btn`}
              label="Yes"
              onClick={() => updateIsDelete()}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ApprovalDashboard;
