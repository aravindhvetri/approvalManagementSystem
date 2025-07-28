//Default Imports:
import * as React from "react";
import { useEffect, useState } from "react";
//primeReact Imports:
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MdUpdate } from "react-icons/md";
import { RiGitPullRequestLine } from "react-icons/ri";
//Styles Imports:
import dashboardStyles from "./Dashboard.module.scss";
import "../../../../External/style.css";
//CommonService Imports:
import {
  ActionsMenu,
  cardStatusTemplate,
  multiplePeoplePickerTemplate,
  peoplePickerTemplate,
  statusTemplate,
} from "../../../../CommonServices/CommonTemplates";
import SPServices from "../../../../CommonServices/SPServices";
import { Config } from "../../../../CommonServices/Config";
import {
  IPeoplePickerDetails,
  IRequestHubDetails,
} from "../../../../CommonServices/interface";
import RequestsFields from "../DynamicsRequests/RequestsFields";
import moment from "moment";
import Loader from "../Loader/Loader";

const MyRequestPage = ({
  setCurrentTableDataForDataCard,
  filterCategory,
  context,
  sideBarVisible,
  setRequestsDashBoardContent,
  setDynamicRequestsSideBarVisible,
}) => {
  //State Variables:
  const [requestsDetails, setRequestsDetails] = useState<IRequestHubDetails[]>(
    []
  );
  //Record Action
  const [recordAction, setRecordAction] = useState<string>("");
  // const [selectedCategoryId, setSelectedCategoryId] = useState<number>(null);
  const [currentRecord, setCurrentRecord] = useState<IRequestHubDetails>();
  const [navigateFrom, setNavigateFrom] = useState<string>("");
  const [showLoader, setShowLoader] = useState<boolean>(true);

  //Set Actions PopUp:
  const actionsWithIcons = (rowData: IRequestHubDetails) => [
    {
      label: "View",
      icon: "pi pi-eye",
      className: "customView",
      command: () => {
        setRecordAction("View");
        setShowLoader(true);
        setCurrentRecord(rowData);
        // setSelectedCategoryId(rowData.CategoryId);
        setDynamicRequestsSideBarVisible(true);
      },
    },
    rowData.status === "Rejected" && rowData.approvalJson[0].RejectionFlow !== 2
      ? {
          label: "Edit",
          icon: "pi pi-file-edit",
          className: "customEdit",
          command: (event: any) => {
            setRecordAction("Edit");
            setCurrentRecord(rowData);
            // setSelectedCategoryId(rowData.CategoryId);
            setDynamicRequestsSideBarVisible(true);
          },
        }
      : "",
  ];

  //Get RequestHub Details:
  const getRequestsHubDetails = async () => {
    try {
      const res = await SPServices.SPReadItems({
        Listname: Config.ListNames.RequestsHub,
        Select:
          "*,Category/Id,Category/Category,Author/Id,Author/Title,Author/EMail",
        Expand: "Category,Author",
        Orderby: "Modified",
        Orderbydecorasc: false,
        Filter: [
          {
            FilterKey: "Author/EMail",
            Operator: "eq",
            FilterValue: context._pageContext._user.email,
          },
          { FilterKey: "IsDelete", Operator: "eq", FilterValue: "false" },
        ],
        FilterCondition: "and",
      });
      const temArr: IRequestHubDetails[] = await Promise.all(
        res.map(async (item: any) => {
          return {
            id: item.ID,
            requestId: item?.RequestID ? item?.RequestID : "R-00001",
            status: item?.Status,
            category: item?.Category?.Category,
            CategoryId: item?.CategoryId,
            approvalJson: JSON.parse(item?.ApprovalJson),
            createdDate: item?.Created,
            author: {
              id: item?.Author.Id,
              email: item?.Author.EMail,
              name: item?.Author.Title,
            },
          };
        })
      );
      filterCategory ? filterRecords(temArr) : setRequestsDetails([...temArr]);
      setShowLoader(false);
    } catch (e) {
      console.log("RequestsHub Error", e);
    }
  };

  //Filter records for approvers
  const filterRecords = (tempArr) => {
    const filterTempArr = tempArr.filter(
      (item) => item?.CategoryId === filterCategory.id
    );
    setRequestsDetails([...filterTempArr]);
    setShowLoader(false);
  };

  //Render Status Column:
  const renderStatusColumn = (rowData: IRequestHubDetails) => {
    return <div>{cardStatusTemplate(rowData?.status)}</div>;
  };

  //Render Stage level Approver Column:
  const renderStagelevelApproverColumns = (
    rowData: IRequestHubDetails,
    Columncode: number
  ) => {
    //Current Stage
    const currentSatge = () => {
      return rowData.approvalJson[0].Currentstage;
    };
    //Current Stage Approvers
    const approvers = (): IPeoplePickerDetails[] => {
      return rowData.approvalJson.flatMap((e) =>
        e?.stages
          .find((stage) => stage?.stage === e.Currentstage)
          .approvers.flatMap((approver) => ({
            id: approver.id,
            name: approver.name,
            email: approver.email,
          }))
      );
    };
    //Current Pending Approval on that stage
    const pendingApprovals = (): IPeoplePickerDetails[] => {
      return rowData.approvalJson.flatMap((e) =>
        e?.stages
          .find((stage) => stage?.stage === e.Currentstage)
          .approvers.flatMap((approver) =>
            approver.statusCode === 0
              ? {
                  id: approver.id,
                  name: approver.name,
                  email: approver.email,
                }
              : []
          )
      );
    };
    //Approved Approvers
    const approvedApprovers = (): IPeoplePickerDetails[] => {
      return rowData.approvalJson.flatMap((e) =>
        e?.stages.flatMap((stage) =>
          stage.approvers.flatMap((approver) =>
            approver.statusCode === 1
              ? {
                  id: approver.id,
                  name: approver.name,
                  email: approver.email,
                }
              : []
          )
        )
      );
    };
    return (
      <div>
        {Columncode === 1 && rowData.status !== "Approved"
          ? approvers().length > 1
            ? multiplePeoplePickerTemplate(approvers())
            : peoplePickerTemplate(approvers()[0])
          : Columncode === 2 && rowData.status !== "Approved"
          ? pendingApprovals().length > 1
            ? multiplePeoplePickerTemplate(pendingApprovals())
            : peoplePickerTemplate(pendingApprovals()[0])
          : Columncode === 3
          ? approvedApprovers().length > 1
            ? multiplePeoplePickerTemplate(approvedApprovers())
            : peoplePickerTemplate(approvedApprovers()[0])
          : Columncode === 4 && rowData.status !== "Approved"
          ? currentSatge()
          : ""}
      </div>
    );
  };

  //Render Action Column:
  const renderActionColumn = (rowData: IRequestHubDetails) => {
    const menuModel = actionsWithIcons(rowData);
    return <ActionsMenu items={menuModel.filter((e) => e !== "")} />;
  };

  useEffect(() => {
    getRequestsHubDetails();
    setNavigateFrom("MyRequest");
  }, [null, sideBarVisible, filterCategory]);

  useEffect(() => {
    setCurrentTableDataForDataCard([...requestsDetails]);
  }, [requestsDetails]);
  return (
    <>
      {showLoader ? (
        <Loader />
      ) : (
        <>
          {/* <div className="customDataTableContainer">
            <DataTable
              paginator
              rows={5}
              value={requestsDetails}
              tableStyle={{ minWidth: "50rem" }}
              emptyMessage={
                <>
                  <p style={{ textAlign: "center" }}>No Records Found</p>
                </>
              }
            >
              <Column
                className={dashboardStyles.highlightedRequestId}
                field="requestId"
                header="Request id"
              ></Column>
              <Column field="category" header="Category"></Column>
              <Column
                field="createdDate"
                body={(rowData) =>
                  moment(rowData.createdDate).format("DD/MM/YYYY")
                }
                header="Request date"
              ></Column>
              <Column
                hidden
                field="approvalJson"
                header="Current Stage"
                body={(e) => renderStagelevelApproverColumns(e, 4)}
              ></Column>
              <Column
                hidden
                field="approvalJson"
                header="Approvers"
                body={(e) => renderStagelevelApproverColumns(e, 1)}
              ></Column>
              <Column
                hidden
                field="approvalJson"
                header="Pending Approval"
                body={(e) => renderStagelevelApproverColumns(e, 2)}
              ></Column>
              <Column
                hidden
                field="approvalJson"
                header="Approved by"
                body={(e) => renderStagelevelApproverColumns(e, 3)}
              ></Column>
              <Column
                field="status"
                header="Status"
                body={renderStatusColumn}
                style={{ width: "10rem" }}
              ></Column>
              <Column field="Action" body={renderActionColumn}></Column>
            </DataTable>
          </div> */}
          <div className="customDataTableCardContainer">
            <div className={dashboardStyles.profile_header_content}>
              <span>My requests</span>
              <p>View and manage requests you've submitted</p>
            </div>
            <div className="allRecords">
              <span style={{ fontFamily: "interSemiBold" }}>All requests</span>
            </div>
            <div className="dashboardDataTable">
              <DataTable
                value={requestsDetails}
                paginator
                rows={2}
                className="custom-card-table"
                emptyMessage={
                  <p style={{ textAlign: "center" }}>No Records Found</p>
                }
              >
                <Column
                  body={(rowData) => (
                    <div className={dashboardStyles.requestCard}>
                      <div className={dashboardStyles.requestCardHeader}>
                        <div className={dashboardStyles.requestId}>
                          <p className={dashboardStyles.requestIdpara}>
                            {rowData.requestId}
                          </p>
                          <h3 className={dashboardStyles.requestIdTitle}>
                            <RiGitPullRequestLine
                              style={{ fontSize: "20px" }}
                            />
                            {rowData.category}
                          </h3>
                        </div>
                      </div>
                      <div className={dashboardStyles.requestCardBody}>
                        <div className={dashboardStyles.requestIdDetails}>
                          <p className={dashboardStyles.requestIdpara}>
                            {/* <MdUpdate style={{ fontSize: "18px" }} /> Submitted{" "} */}
                            {moment(rowData.createdDate).format("DD/MM/YYYY")}
                          </p>
                        </div>
                        <span>{renderStatusColumn(rowData)}</span>
                        {renderActionColumn(rowData)}
                      </div>
                    </div>
                  )}
                />
              </DataTable>
            </div>
          </div>
          {currentRecord && (
            <RequestsFields
              context={context}
              requestsDetails={requestsDetails}
              setRequestsDetails={setRequestsDetails}
              sideBarVisible={sideBarVisible}
              currentRecord={currentRecord}
              navigateFrom={navigateFrom}
              recordAction={recordAction}
              setRequestsDashBoardContent={setRequestsDashBoardContent}
              setDynamicRequestsSideBarVisible={
                setDynamicRequestsSideBarVisible
              }
              setShowLoader={setShowLoader}
            />
          )}
          {/* <div>
            <AttachmentUploader context={context} />
          </div> */}
        </>
      )}
    </>
  );
};

export default MyRequestPage;
