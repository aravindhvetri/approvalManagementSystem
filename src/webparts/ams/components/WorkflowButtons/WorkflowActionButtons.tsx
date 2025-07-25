//Default Imports:
import * as React from "react";
import { useEffect, useState } from "react";
//PrimeReact Imports:
import { Button } from "primereact/button";
//CommonService Imports:
import {
  IemailMessage,
  IPeoplePickerDetails,
  IRequestHubDetails,
} from "../../../../CommonServices/interface";
import SPServices from "../../../../CommonServices/SPServices";
import { Config } from "../../../../CommonServices/Config";
//Style Imports
import styles from "./WorkFlowActionButtons.module.scss";
import { Item } from "@pnp/sp/items";
import { sp } from "@pnp/sp/presets/all";
import {
  generateRequestID,
  sendNotification,
} from "../../../../CommonServices/CommonTemplates";
import moment from "moment";
import Loader from "../Loader/Loader";

const WorkflowActionButtons = ({
  validateForm,
  approvalDetails,
  showSignatureByStage,
  setApprovalDetails,
  setRequestsSideBarVisible,
  context,
  files,
  setFiles,
  signatureFieldConfig,
  updatedRecord,
  requestsHubDetails,
  setRequestsHubDetails,
  itemID,
}) => {
  const serverRelativeUrl = context?._pageContext?._site?.serverRelativeUrl;

  //useStates
  const [submitBtn, setSubmitBtn] = useState(false);
  const [reSubmit, setReSubmit] = useState(false);
  const [approvalBtn, setapprovalBtn] = useState(false);
  const [author, setAuthor] = useState<IPeoplePickerDetails>();
  const [approverDescriptionErrMsg, setApproverDescriptionErrMsg] =
    useState<string>("");
  //Variables
  const loginUser = context._pageContext._user.email;
  const currentRec = requestsHubDetails?.find((e) => e.id === itemID);
  const [showLoader, setShowLoader] = useState<boolean>(false);

  //Get RequestHubDetails List
  const getRequestHubDetails = () => {
    SPServices.SPReadItemUsingId({
      Listname: Config.ListNames.RequestsHub,
      Select: "*,Author/ID,Author/Title,Author/EMail",
      Expand: "Author",
      SelectedId: itemID,
    })
      .then((Item: any) => {
        setAuthor({
          id: Item.Author.ID,
          name: Item.Author.Title,
          email: Item.Author.EMail,
        });
      })
      .catch((err: any) => console.log("error getRequestHubDetails", err));
  };

  //Update Status by approver
  const updateStatusByApprover = (data, email, newStatusCode) => {
    const updatedDetails = requestsHubDetails?.map(
      (item: IRequestHubDetails) => {
        if (item.id === itemID) {
          var updateStage = null;
          var statusUpdate = item?.status;
          const updatedItem: any = {
            ...item,
            approvalJson: data.map((approvalFlow) => ({
              ...approvalFlow,
              stages: approvalFlow.stages.map((stage) => {
                if (approvalFlow.Currentstage === stage.stage) {
                  // First, update the approvers' status codes
                  const updatedApprovers = stage.approvers.map((approver) =>
                    approver.email === email
                      ? { ...approver, statusCode: newStatusCode }
                      : approver
                  );
                  // Then, check if all approvers have statusCode === 1
                  const allApproved =
                    stage.ApprovalType === 2
                      ? updatedApprovers.every(
                          (approver) => approver.statusCode === 1
                        )
                      : stage.ApprovalType === 1 &&
                        updatedApprovers.some(
                          (approver) => approver.statusCode === 1
                        );
                  // Then, check if anyone approvers have statusCode === 2
                  const anyoneRejected = updatedApprovers.some(
                    (approver) => approver.statusCode === 2
                  );
                  // Update CurrentStage
                  const updateStageVal = allApproved
                    ? approvalFlow.Currentstage === approvalFlow.TotalStages
                      ? ((statusUpdate = "Approved"),
                        (updateStage = approvalFlow.Currentstage))
                      : (updateStage = approvalFlow.Currentstage + 1)
                    : ((updateStage = approvalFlow.Currentstage),
                      anyoneRejected
                        ? (statusUpdate = "Rejected")
                        : (statusUpdate = statusUpdate));

                  return {
                    ...stage,
                    approvers: updatedApprovers,
                    stageStatusCode: allApproved
                      ? 1
                      : anyoneRejected
                      ? 2
                      : stage.stageStatusCode,
                  };
                } else {
                  return { ...stage };
                }
              }),
              Currentstage: updateStage,
            })),
            status: statusUpdate,
          };

          updateSharePointList(updatedItem, newStatusCode);
          return updatedItem;
        } else {
          return { ...item };
        }
      }
    );
    setRequestsHubDetails([...updatedDetails]);
  };

  //Update status by user
  const updateStatusByUser = (data, email, newStatusCode) => {
    //Update status and ApprovalJson
    const updatedDetails = requestsHubDetails?.map(
      (item: IRequestHubDetails) => {
        if (item.id === itemID) {
          const updatedItem: any = {
            ...item,
            status: "Pending",
            approvalJson: data.map((approvalFlow) => ({
              ...approvalFlow,
              Currentstage:
                approvalFlow.RejectionFlow === 0
                  ? 1
                  : approvalFlow.RejectionFlow === 1 &&
                    approvalFlow.Currentstage,

              stages: approvalFlow.stages.map((stage) => {
                //Update stageStatusCode
                const stageStatusCodeByUser =
                  approvalFlow.RejectionFlow === 0
                    ? 0
                    : stage.stageStatusCode === 2
                    ? 0
                    : stage.stageStatusCode;

                //Update approvers
                const stageApproversByUser = stage.approvers?.map((approver) =>
                  approvalFlow.RejectionFlow === 0
                    ? { ...approver, statusCode: 0 }
                    : approver.statusCode === 2
                    ? { ...approver, statusCode: 0 }
                    : { ...approver, statusCode: approver.statusCode }
                );
                return {
                  ...stage,
                  approvers: stageApproversByUser,
                  stageStatusCode: stageStatusCodeByUser,
                };
              }),
            })),
          };
          updateSharePointList(updatedItem, newStatusCode);
          return updatedItem;
        } else {
          return { ...item };
        }
      }
    );
    setRequestsHubDetails([...updatedDetails]);
  };

  //Add Records in Approval History
  const addApprovalHistory = async (Process) => {
    const user: any = await SPServices.getCurrentUsers();
    SPServices.SPAddItem({
      Listname: Config.ListNames.ApprovalHistory,
      RequestJSON: {
        ParentIDId: approvalDetails?.parentID,
        Stage: approvalDetails?.stage,
        ApproverId: user.Id,
        Status: Process,
        Comments: approvalDetails?.comments || "",
        Signature: approvalDetails?.signature || "",
      },
    })
      .then((e) => {})
      .catch((e) => {
        console.log("Add approval history error", e);
      });
  };

  //On Approval Click
  const onApprovalClick = async () => {
    const isSignatureRequired = signatureFieldConfig?.isMandatory === true;
    const isSignatureEmpty = !approvalDetails?.signature;
    console.log(showSignatureByStage, "showSignatureByStage");
    if (isSignatureEmpty && showSignatureByStage) {
      setApproverDescriptionErrMsg("* Signature is mandatory");
      return;
    }
    setApproverDescriptionErrMsg("");
    setShowLoader(true);
    try {
      await addApprovalHistory("Approved");
      updateStatusByApprover(currentRec.approvalJson, loginUser, 1);
      addDatasFromAttachmentLibraryRequestors(itemID, files, "Approvers");
    } catch (e) {
      console.log("Approval history patch err", e);
      setShowLoader(false);
    }
  };

  //On Rejection Click
  const onRejectionClick = async () => {
    const isCommentEmpty = !approvalDetails?.comments.trim();
    const isSignatureRequired = signatureFieldConfig?.isMandatory === true;
    const isSignatureEmpty = !approvalDetails?.signature;
    console.log(
      isSignatureEmpty,
      "isSignatureEmpty" + isSignatureRequired,
      "isSignatureRequired" + showSignatureByStage,
      "showSignatureByStage"
    );

    let errorMessage = "";

    if (isCommentEmpty) {
      errorMessage += "* Approver description is mandatory for rejection";
    }

    if (isSignatureEmpty && showSignatureByStage) {
      errorMessage += errorMessage
        ? " and signature is mandatory"
        : "* Signature is mandatory";
    }

    if (errorMessage) {
      setApproverDescriptionErrMsg(errorMessage);
      // setShowLoader(false);
      return;
    }

    setApproverDescriptionErrMsg("");
    setShowLoader(true);
    try {
      await addApprovalHistory("Rejected");
      updateStatusByApprover(currentRec.approvalJson, loginUser, 2);
      addDatasFromAttachmentLibraryRequestors(itemID, files, "Approvers");
    } catch (e) {
      console.log("Approval history patch err", e);
      setShowLoader(false);
    }
  };

  //On Re_Submit Click
  const onResubmitClick = async () => {
    const fieldsValidation: boolean = await validateForm();
    if (fieldsValidation) {
      setShowLoader(true);
      SPServices.SPUpdateItem({
        Listname: Config.ListNames.RequestsHub,
        RequestJSON: updatedRecord,
        ID: itemID,
      })
        .then(() => {
          updateStatusByUser(currentRec.approvalJson, loginUser, 0);
          addDatasFromAttachmentLibraryRequestors(itemID, files, "Requestors");
        })
        .catch((err) => {
          console.log("Resubmission error", err);
          setShowLoader(false);
        });
    }
  };

  //Add Datas From Attachment Library Requestors:
  const addDatasFromAttachmentLibraryRequestors = async (id, files, folder) => {
    try {
      const folderPath = `${serverRelativeUrl}/${Config.LibraryNames?.AttachmentsLibrary}/${folder}`;
      const requestId = `${id}`;

      for (const file of files) {
        const fileBuffer = await file.arrayBuffer();
        const uploadResult = await sp.web
          .getFolderByServerRelativeUrl(folderPath)
          .files.add(file.name, fileBuffer, true);

        await uploadResult.file.listItemAllFields.get().then(async (item) => {
          await sp.web.lists
            .getByTitle(Config.LibraryNames?.AttachmentsLibrary)
            .items.getById(item.Id)
            .update({
              RequestID: requestId,
            });
        });
      }
      setFiles([]);
      setShowLoader(false);
    } catch (error) {
      console.error("Error uploading files:", error);
      setShowLoader(false);
    }
  };

  //Button Visibility
  const visibleButtons = () => {
    setSubmitBtn(false);
    setReSubmit(false);
    setapprovalBtn(false);
    const tempStage = currentRec.approvalJson[0].stages.find(
      (e) => e.stage === currentRec.approvalJson[0].Currentstage
    );
    const tempStageApprovers = [...tempStage.approvers];
    return (
      currentRec.status !== "Approved" &&
      (currentRec.status === "Pending"
        ? (loginUser === author?.email && setSubmitBtn(true),
          tempStageApprovers.some(
            (Approvers) => Approvers.email === loginUser
          ) &&
            tempStageApprovers.find((e) => e.email === loginUser).statusCode ===
              0 &&
            setapprovalBtn(true))
        : loginUser === author?.email &&
          currentRec.approvalJson[0].RejectionFlow !== 2 &&
          setReSubmit(true))
    );
  };

  //Set status
  const statusCodeDecode = (statusCode) => {
    switch (statusCode) {
      case 0:
        return "ReSubmit";
      case 1:
        return "Approval";
      case 2:
        return "Reject";
    }
  };

  //Get CategoryEmailConfig
  const getCategoryEmailConfig = async (Item, Status) => {
    try {
      const res: any = await SPServices.SPReadItems({
        Listname: Config.ListNames.CategoryEmailConfig,
        Select: "*,Category/Id,ParentTemplate/Id",
        Expand: "Category,ParentTemplate",
        Filter: [
          {
            FilterKey: "CategoryId",
            Operator: "eq",
            FilterValue: Item?.CategoryId.toString(),
          },
          {
            FilterKey: "Process",
            Operator: "eq",
            FilterValue: Status,
          },
        ],
        FilterCondition: "and",
      });
      const emailContent = await getEmailTemplateConfig(res[0]);
      return emailContent;
    } catch {
      (err) => console.log("getCategoryEmailConfig err", err);
    }
  };

  //Get EmailTemplateConfig
  const getEmailTemplateConfig = async (categoryEmail) => {
    try {
      const res = await SPServices.SPReadItemUsingID({
        Listname: Config.ListNames.EmailTemplateConfig,
        SelectedId: categoryEmail?.ParentTemplateId,
        Select: "*",
      });
      return res;
    } catch {
      (err) => console.log("getEmailTemplateConfig err", err);
    }
  };

  //sent email to NextStageApprovers
  const sentEmailtoNextStageApprovers = async (Item: any, statusCode) => {
    const tempApprovalJson = JSON.parse(Item?.ApprovalJson);
    const authorDetails = await sp.web.siteUsers.getById(Item?.AuthorId).get();
    const approverDetails = await sp.web.siteUsers
      .getByEmail(approvalDetails?.approverEmail)
      .get();
    const stageData = tempApprovalJson[0]?.stages?.find(
      (stage) => stage?.stage === tempApprovalJson[0]?.Currentstage
    );
    const allPending = stageData?.approvers?.every(
      (e: any) => e?.statusCode === 0
    );
    const tempEmailToPersons: string[] = allPending ? stageData?.approvers : [];
    const replaceDynamicContentArr = {
      "[$RequestID]": `R-${generateRequestID(Item.ID, 5, 0)}`,
      "[$Requestor]": authorDetails?.Title,
      "[$RequestDate]": moment(Item?.Created).format("DD-MM-YYYY"),
      "[$RejectedBY]": approverDetails?.Title,
      "[$ApprovedBY]": approverDetails?.Title,
      "[$ApproverComments]": approvalDetails?.comments,
      "[$Status]":
        statusCode === 1 ? "Approved" : statusCode === 2 ? "Rejected" : "",
    };
    const template: any = await getCategoryEmailConfig(Item, "Submit");
    tempEmailToPersons.forEach((emailTo: any) => {
      let finalBody = "";
      replaceDynamicContentArr["[$ToPerson]"] = emailTo?.name;
      Object.keys(replaceDynamicContentArr).forEach((key) => {
        finalBody = template?.EmailBody.replace(/\[\$\w+\]/g, (matched) => {
          return replaceDynamicContentArr[matched] || matched;
        });
      });
      const tempMsgContent: IemailMessage = {
        To: [`${emailTo?.email}`],
        Subject: template?.TemplateName,
        Body: finalBody,
      };
      sendNotification(tempMsgContent);
    });
  };

  //Get email content
  const getEmailContent = async (
    itemData,
    emailSubject,
    emailBody,
    statusCode
  ) => {
    const tempApprovalJson = JSON.parse(itemData?.ApprovalJson);
    const authorDetails = await sp.web.siteUsers
      .getById(itemData?.AuthorId)
      .get();
    const approverDetails = await sp.web.siteUsers
      .getByEmail(approvalDetails?.approverEmail)
      .get();

    const tempEmailToPersons: string[] =
      statusCode === 0
        ? tempApprovalJson[0]?.stages
            ?.find(
              (stage) => stage?.stage === tempApprovalJson[0]?.Currentstage
            )
            ?.approvers?.map((element: any) => element) || []
        : statusCode === 2 || statusCode === 1
        ? [
            {
              email: authorDetails?.Email,
              id: authorDetails?.Id,
              name: authorDetails?.Title,
              statusCode: null,
            },
          ]
        : [];

    if (statusCode === 1) {
      await sentEmailtoNextStageApprovers(itemData, statusCode);
    }
    const replaceDynamicContentArr = {
      "[$RequestID]": `R-${generateRequestID(itemData.ID, 5, 0)}`,
      "[$Requestor]": authorDetails?.Title,
      "[$RequestDate]": moment(itemData?.Created).format("DD-MM-YYYY"),
      "[$RejectedBY]": approverDetails?.Title,
      "[$ApprovedBY]": approverDetails?.Title,
      "[$ApproverComments]": approvalDetails?.comments,
      "[$Status]":
        statusCode === 1 ? "Approved" : statusCode === 2 ? "Rejected" : "",
    };
    tempEmailToPersons.forEach((emailTo: any) => {
      let finalBody = "";
      replaceDynamicContentArr["[$ToPerson]"] = emailTo?.name;
      Object.keys(replaceDynamicContentArr).forEach((key) => {
        finalBody = emailBody?.replace(/\[\$\w+\]/g, (matched) => {
          return replaceDynamicContentArr[matched] || matched;
        });
      });
      const tempMsgContent: IemailMessage = {
        To: [`${emailTo?.email}`],
        Subject: emailSubject,
        Body: finalBody,
      };
      sendNotification(tempMsgContent);
    });
  };

  //Update SharePoint List
  const updateSharePointList = async (
    updatedItem: IRequestHubDetails,
    statusCode
  ) => {
    SPServices.SPUpdateItem({
      Listname: Config?.ListNames?.RequestsHub,
      RequestJSON: {
        ApprovalJson: JSON.stringify(updatedItem.approvalJson),
        Status: updatedItem?.status,
      },
      ID: updatedItem?.id,
    })
      .then(() => {
        SPServices.SPReadItemUsingId({
          Listname: Config.ListNames.RequestsHub,
          Select: "*,Author/ID,Author/Title,Author/EMail",
          Expand: "Author",
          SelectedId: updatedItem?.id,
        })
          .then(async (Item: any) => {
            let Status = statusCodeDecode(statusCode);
            const template: any = await getCategoryEmailConfig(Item, Status);
            await getEmailContent(
              Item,
              template?.TemplateName,
              template?.EmailBody,
              statusCode
            );
            setRequestsSideBarVisible(false);
            await setShowLoader(false);
          })
          .catch((err: any) => {
            console.log("error getRequestHubDetails", err);
            setShowLoader(false);
          });
      })
      .catch((e) => {
        console.log("Error while updating SharePoint list", e);
      });
  };

  //useEffect
  useEffect(() => {
    visibleButtons();
  });
  useEffect(() => {
    if (approvalDetails?.comments || approvalDetails?.signature) {
      setApproverDescriptionErrMsg("");
    }
  }, [approvalDetails]);
  useEffect(() => {
    getRequestHubDetails();
  }, []);

  return (
    <>
      <div className={styles.workFlowButtons}>
        {/* {submitBtn && <Button label="Submit" />} */}
        {approvalBtn && (
          <>
            <span className="errorMsg">{approverDescriptionErrMsg}</span>
            <Button
              icon="pi pi-times"
              label="Cancel"
              className="customCancelButton"
              onClick={() => setRequestsSideBarVisible(false)}
            />
            <Button
              label="Reject"
              className="customRejectButton"
              icon="pi pi-times-circle"
              onClick={() => {
                onRejectionClick();
              }}
            />
            <Button
              label="Approve"
              className="customSubmitButton"
              icon="pi pi-check-circle"
              onClick={() => {
                onApprovalClick();
              }}
            />
          </>
        )}
        {reSubmit && (
          <Button
            label="Re_submit"
            className="customSubmitButton"
            icon="pi pi-save"
            onClick={() => {
              onResubmitClick();
            }}
          />
        )}
      </div>
      {showLoader ? <Loader /> : ""}
    </>
  );
};
export default WorkflowActionButtons;
