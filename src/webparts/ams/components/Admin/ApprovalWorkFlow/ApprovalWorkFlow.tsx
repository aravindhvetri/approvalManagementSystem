//Deafault Imports:
import * as React from "react";
import { useEffect, useState } from "react";
//Prime React Imports:
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { FaRegTrashAlt } from "react-icons/fa";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
//Common Service Imports:
import SPServices from "../../../../../CommonServices/SPServices";
//Styles Imports:
import "../../../../../External/style.css";
import "../ApprovalWorkFlow/ApprovalWorFlow.css";
import ApprovalWorkFlowStyles from "./ApprovalWorkFlow.module.scss";
import { Label } from "office-ui-fabric-react";
import {
  IApprovalDetailsPatch,
  IApprovalFlowValidation,
  IApprovalStages,
  IBasicDropDown,
  IDropdownDetails,
  IPeoplePickerDetails,
  IRightSideBarContents,
} from "../../../../../CommonServices/interface";
import { sp } from "@pnp/sp";
import { Config } from "../../../../../CommonServices/Config";
import Loader from "../../Loader/Loader";
import {
  multiplePeoplePickerTemplate,
  notesContainerDetails,
  peoplePickerTemplate,
  statusTemplate,
} from "../../../../../CommonServices/CommonTemplates";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MdAppRegistration } from "react-icons/md";

const ApprovalWorkFlow = ({
  currentRec,
  isEdit,
  usedCategories,
  setIsEdit,
  setCurrentRecord,
  approvalTableRender,
  ApprovalConfigSideBarVisible,
  setApprovalSideBarContent,
  setApprovalSideBarVisible,
  context,
}) => {
  const [approvalFlowDetails, setApprovalFlowDetails] =
    useState<IApprovalDetailsPatch>({
      ...Config.ApprovalConfigDefaultDetails,
    });
  console.log("approvalFlowDetails", approvalFlowDetails);
  const [rejectionFlowChoice, setRejectionFlowChoice] =
    useState<IDropdownDetails>({
      ...Config.initialConfigDrop,
    });
  const [approvalType, setApprovalType] = useState<IDropdownDetails>({
    ...Config.initialConfigDrop,
  });
  const [validation, setValidation] = useState<IApprovalFlowValidation>({
    ...Config.ApprovalFlowValidation,
  });
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const warningNote = [
    {
      info: ` This email flow is already used by the following categories: ${usedCategories.join(
        ", "
      )}. Please review them carefully before making any changes`,
    },
  ];
  const [selectedStage, setSelectedStage] = useState({});
  console.log("selectedStage", selectedStage);

  //ApprovalConfig Details Patch
  const addApprovalConfigDetails = (addData: IApprovalDetailsPatch) => {
    SPServices.SPAddItem({
      Listname: Config.ListNames.ApprovalConfig,
      RequestJSON: {
        ApprovalFlowName: addData?.apprvalFlowName,
        TotalStages: addData?.totalStages,
        RejectionFlow: addData?.rejectionFlow,
      },
    })
      .then(async (res: any) => {
        await addData?.stages?.forEach((stage) =>
          addApprovalStageConfigDetails(res?.data.ID, stage)
        );
        setApprovalFlowDetails({ ...Config.ApprovalConfigDefaultDetails });
        await approvalTableRender();
        setApprovalSideBarVisible(false);
        await setShowLoader(false);
      })
      .catch((err) => {
        console.log("addApprovalConfigDetails error", err);
        setShowLoader(false);
      });
  };

  //ApprovalStageConfig Details Patch
  const addApprovalStageConfigDetails = (
    parentId: number,
    stage: IApprovalStages
  ) => {
    const tempApprovers = stage?.approver?.map((e) => e.id);
    SPServices.SPAddItem({
      Listname: Config.ListNames.ApprovalStageConfig,
      RequestJSON: {
        ParentApprovalId: parentId,
        Stage: stage?.stage,
        ApprovalProcess: stage?.approvalProcess,
        ApproverId: { results: tempApprovers },
      },
    })
      .then((res: any) => {})
      .catch((err) => console.log("addApprovalStageConfigDetails error", err));
  };

  //Update ApprovalStageConfig
  const updateApprovalConfig = (updateData: IApprovalDetailsPatch) => {
    SPServices.SPUpdateItem({
      Listname: Config.ListNames.ApprovalConfig,
      RequestJSON: {
        ApprovalFlowName: updateData?.apprvalFlowName,
        TotalStages: updateData?.totalStages,
        RejectionFlow: updateData?.rejectionFlow,
      },
      ID: currentRec?.id,
    })
      .then(async (res) => {
        await getApprovalStageConfigDelete(updateData, currentRec?.id);
      })
      .catch((err) => {
        console.log("updateApprovalStageConfig error", err);
        setShowLoader(false);
      });
  };

  // Separate function to delete stage config records
  const getApprovalStageConfigDelete = async (updateData, parentID) => {
    try {
      const res: any = await SPServices.SPReadItems({
        Listname: Config.ListNames.ApprovalStageConfig,
        Select: "*",
        Filter: [
          {
            FilterKey: "ParentApprovalId",
            Operator: "eq",
            FilterValue: parentID.toString(),
          },
        ],
      });
      await Promise.all(
        res.map((rec) => deleteRecordApprovalStageConfig(rec?.ID))
      );
      await Promise.all(
        updateData?.stages?.map((stage) =>
          addApprovalStageConfigDetails(currentRec?.id, stage)
        )
      );
      setTimeout(async () => {
        setApprovalFlowDetails({ ...Config.ApprovalConfigDefaultDetails });
        await approvalTableRender();
        await setApprovalSideBarVisible(false);
        setShowLoader(false);
      }, 3000);
    } catch (err) {
      console.log("getApprovalStageConfigDelete error", err);
    }
  };

  //Delete record in ApprovalStageConfig
  const deleteRecordApprovalStageConfig = (itemID) => {
    SPServices.SPDeleteItem({
      Listname: Config.ListNames.ApprovalStageConfig,
      ID: itemID,
    })
      .then(() => {})
      .catch((err) => {
        console.log("deleteRecordApprovalStageConfig err", err);
      });
  };

  //Get rejectionFlowChoice Choices
  const getRejectionFlowChoices = () => {
    SPServices.SPGetChoices({
      Listname: Config.ListNames.ApprovalConfig,
      FieldName: "RejectionFlow",
    })
      .then((res: any) => {
        const temArr: IBasicDropDown[] = [];
        res?.Choices.map((choice) =>
          temArr.push({
            name: choice,
          })
        );
        setRejectionFlowChoice((prev: IDropdownDetails) => ({
          ...prev,
          rejectionFlowDrop: temArr,
        }));
        setShowLoader(false);
      })
      .catch((err) => {
        console.log("getRejectionFlowChoices error", err);
      });
  };

  //onChange handle
  const onChangeHandle = (key, value) => {
    approvalFlowDetails[key] = value;
    setApprovalFlowDetails({ ...approvalFlowDetails });
  };

  //Add stage
  const addStage = () => {
    const tempStage: IApprovalStages[] = approvalFlowDetails?.stages.slice();
    tempStage.push({
      stage: approvalFlowDetails?.stages?.length + 1,
      approvalProcess: null,
      approver: [],
    });
    approvalFlowDetails["stages"] = [...tempStage];
    setApprovalFlowDetails({
      ...approvalFlowDetails,
      totalStages: approvalFlowDetails?.stages?.length,
    });
    setSelectedStage({
      stage: approvalFlowDetails?.stages?.length,
      approvalProcess: null,
      approver: [],
    });
  };

  //Remove stage
  const removeStage = (stageIndex) => {
    var newStages = approvalFlowDetails?.stages?.slice();
    newStages.splice(stageIndex, 1)[0];
    const orderedStage: IApprovalStages[] = [];
    newStages.forEach((e, i) =>
      orderedStage.push({
        stage: i + 1,
        approvalProcess: e?.approvalProcess,
        approver: e?.approver,
      })
    );
    approvalFlowDetails["stages"] = [...orderedStage];
    setApprovalFlowDetails({
      ...approvalFlowDetails,
      totalStages: orderedStage.length,
    });
    console.log("stageIndex", stageIndex);
    console.log("orderedStage", orderedStage);
    if (selectedStage?.["stage"] === stageIndex + 1) {
      setSelectedStage(
        orderedStage.find(
          (e) => e.stage === (stageIndex === 0 ? 1 : stageIndex)
        )
      );
    }
    setValidation({ ...Config.ApprovalFlowValidation });
  };

  //Update stage
  const updateStage = (
    index: number,
    key: keyof IApprovalStages,
    value: any
  ) => {
    const tempUpdateStage: IApprovalStages[] = [...approvalFlowDetails.stages];
    var keyValue;
    if (tempUpdateStage[index]) {
      if (key === "approver") {
        const tempApproverArr: IPeoplePickerDetails[] = [];
        value.map((e) =>
          tempApproverArr.push({
            id: e?.id,
            name: e?.text,
            email: e?.secondaryText,
          })
        );
        keyValue = [...tempApproverArr];
      } else {
        keyValue = value;
      }
      tempUpdateStage[index] = { ...tempUpdateStage[index], [key]: keyValue }; // Update the specific key
    }
    setApprovalFlowDetails({
      ...approvalFlowDetails,
      stages: tempUpdateStage,
    });
  };

  //Validation
  const validRequiredField = async (action) => {
    console.log("validation");
    if (
      approvalFlowDetails?.apprvalFlowName?.trim().length === 0 ||
      approvalFlowDetails?.rejectionFlow?.trim().length === 0
    ) {
      validation["approvalConfigValidation"] =
        "Workflow name and Rejection process both are required";
    } else if (
      approvalFlowDetails?.stages.length === 0 &&
      action === "submit"
    ) {
      validation["approvalConfigValidation"] =
        "Atleast one stage approver is required";
    } else if (
      (action === "addStage" || action === "submit" || action === "") &&
      approvalFlowDetails?.apprvalFlowName.trim() &&
      approvalFlowDetails?.rejectionFlow.trim()
    ) {
      validation["approvalConfigValidation"] = "";
      if (approvalFlowDetails?.stages.length > 0) {
        const tempSatgeErr = approvalFlowDetails?.stages
          ?.map((e, index) =>
            e.approvalProcess === null || e.approver.length === 0 ? index : -1
          )
          .filter((e) => e !== -1);
        if (tempSatgeErr.length > 0) {
          validation["stageErrIndex"] = [...tempSatgeErr];
          validation["stageValidation"] = "People and type are required";
        } else if (tempSatgeErr.length === 0) {
          validation["stageErrIndex"] = [];
          validation["stageValidation"] = "";
        }
      } else {
        validation["stageErrIndex"] = [];
        validation["stageValidation"] = "";
      }
    }
    await setValidation({ ...validation });
    finalValidation(action);
  };
  // Final validation
  const finalValidation = (action) => {
    if (!validation?.approvalConfigValidation && !validation?.stageValidation) {
      {
        action === "addStage"
          ? addStage()
          : action === "submit"
          ? currentRec?.id !== null
            ? updateApprovalConfig(approvalFlowDetails)
            : addApprovalConfigDetails(approvalFlowDetails)
          : "";
      }
    }
    if (
      action == "submit" &&
      !validation?.approvalConfigValidation &&
      !validation?.stageValidation
    ) {
      setShowLoader(true);
    }
  };
  //Render Approvers column
  const renderApproversColumn = (rowData) => {
    const approvers: IPeoplePickerDetails[] = rowData?.approver;
    return (
      <div>
        {approvers.length > 1
          ? multiplePeoplePickerTemplate(approvers)
          : peoplePickerTemplate(approvers[0])}
      </div>
    );
  };
  //Render Rejection Name:
  const renderRejectionName = (data) => {
    return (
      <div className="categoryName">
        <>
          Rejection flow -
          <div className="categoryTag">
            {data === 1
              ? "Anyone can approve"
              : data === 2
              ? "Everyone should approve"
              : ""}
          </div>
        </>
      </div>
    );
  };
  //Stages data table
  const stagesDataTable = () => {
    return (
      <DataTable
        value={approvalFlowDetails?.stages}
        className="custom-card-table"
        selectionMode="single"
        selection={selectedStage}
        scrollable
        scrollHeight="320px"
        onSelectionChange={(e) => {
          e.value && setSelectedStage(e.value);
        }}
        emptyMessage={<p style={{ textAlign: "center" }}>No Records Found</p>}
      >
        <Column
          body={(rowData, row) => (
            <>
              <div
                className="requestCardStage"
                style={
                  selectedStage?.["stage"] === rowData?.stage
                    ? { backgroundColor: " #ecf0f1" }
                    : {}
                }
              >
                <div className="requestCardHeader">
                  <div className="requestId">
                    <h3 className="requestIdTitle">
                      <MdAppRegistration style={{ fontSize: "24px" }} />
                      {`Stage ${rowData?.stage} approval`}
                    </h3>
                  </div>
                  {rowData?.approvalProcess &&
                    renderRejectionName(rowData?.approvalProcess)}
                </div>
                <div className="requestCardBody">
                  {renderApproversColumn(rowData)}
                </div>
              </div>
              <div style={{ marginBottom: "10px" }}>
                {validation?.stageErrIndex.some(
                  (e) =>
                    e ===
                    approvalFlowDetails?.stages.findIndex(
                      (e) => e.stage === rowData?.stage
                    )
                ) && (
                  <div>
                    <span className="errorMsg">
                      {validation?.stageValidation}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        />
      </DataTable>
    );
  };
  ///ApprovalConfigFlowContent
  const ApprovalConfigSidebarContent = () => (
    <>
      {isEdit && currentRec?.id !== null && usedCategories.length > 0 && (
        <>{notesContainerDetails("⚠ Warning", warningNote)}</>
      )}
      <div className={`${ApprovalWorkFlowStyles.maincontainer}`}>
        <div
          className={`${ApprovalWorkFlowStyles.topSection}`}
          style={{ marginBottom: "1rem" }}
        >
          <div className={`${ApprovalWorkFlowStyles.nameDiv}`}>
            <Label className={`${ApprovalWorkFlowStyles.label}`}>
              Name<span className="required">*</span>
            </Label>
            <InputText
              disabled={!isEdit}
              value={approvalFlowDetails?.apprvalFlowName}
              onChange={(e) => {
                onChangeHandle("apprvalFlowName", e.target.value);
                setValidation({ ...Config.ApprovalFlowValidation });
              }}
              placeholder="Workflow Name"
              style={{ width: "100%" }}
            />
          </div>
          <div className={`${ApprovalWorkFlowStyles.rejectDiv}`}>
            <Label className={`${ApprovalWorkFlowStyles.label}`}>
              Rejection Process<span className="required">*</span>
            </Label>
            <Dropdown
              disabled={!isEdit}
              options={rejectionFlowChoice?.rejectionFlowDrop}
              value={rejectionFlowChoice?.rejectionFlowDrop.find(
                (e) => e?.name === approvalFlowDetails?.rejectionFlow
              )}
              optionLabel="name"
              onChange={(e) => {
                onChangeHandle("rejectionFlow", e.value?.name);
                setValidation({ ...Config.ApprovalFlowValidation });
              }}
              placeholder="Select Reject Type"
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <div>
          <span className="errorMsg">
            {validation?.approvalConfigValidation}
          </span>
        </div>
        <div className={`${ApprovalWorkFlowStyles.approvalConfigContainer}`}>
          <div className={`${ApprovalWorkFlowStyles.approvalSubContainer}`}>
            <div
              className={`${ApprovalWorkFlowStyles.approvalStagesContainer}`}
            >
              <Label className={`${ApprovalWorkFlowStyles.label}`}>
                Approval Stages
              </Label>
              {stagesDataTable()}

              {/* {approvalFlowDetails?.stages?.map(function (stage, stageIndex) {
                return (
                  <>
                    <div key={stageIndex} style={{ marginTop: "20px" }}>
                      <h4 className={`${ApprovalWorkFlowStyles.label}`}>
                        Stage {stage.stage} Approver
                        <span className="required">*</span>
                      </h4>
                      <div className={`${ApprovalWorkFlowStyles.stage}`}>
                        <div>
                          <Label className={`${ApprovalWorkFlowStyles.label}`}>
                            People
                          </Label>
                          <PeoplePicker
                            context={context}
                            personSelectionLimit={3}
                            groupName={""}
                            showtooltip={true}
                            disabled={!isEdit}
                            ensureUser={true}
                            defaultSelectedUsers={approvalFlowDetails?.stages[
                              stageIndex
                            ].approver.map((approver) => approver.email)}
                            onChange={(items) =>
                              updateStage(stageIndex, "approver", items)
                            }
                            principalTypes={[PrincipalType.User]}
                            resolveDelay={1000}
                          />
                        </div>
                        <div>
                          <Label className={`${ApprovalWorkFlowStyles.label}`}>
                            Type
                          </Label>
                          <Dropdown
                            disabled={!isEdit}
                            value={approvalType?.approvalFlowType.find(
                              (e) =>
                                e?.id ===
                                approvalFlowDetails?.stages[stageIndex]
                                  .approvalProcess
                            )}
                            options={approvalType?.approvalFlowType}
                            optionLabel="name"
                            onChange={(e) =>
                              updateStage(
                                stageIndex,
                                "approvalProcess",
                                e.value?.id
                              )
                            }
                            placeholder="Select Type of Workflow"
                            style={{ marginTop: "0.5rem" }}
                          />
                        </div>
                        {isEdit && (
                          <div
                            className={`${ApprovalWorkFlowStyles.deleteDiv}`}
                          >
                            <FaRegTrashAlt
                              onClick={() => removeStage(stageIndex)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {validation?.stageErrIndex.some(
                      (e) => e === stageIndex
                    ) && (
                      <div>
                        <span className="errorMsg">
                          {validation?.stageValidation}
                        </span>
                      </div>
                    )}
                  </>
                );
              })} */}
              <div className={`${ApprovalWorkFlowStyles.addStageButton}`}>
                <Button
                  style={{ width: "100%", display: "flow" }}
                  visible={isEdit}
                  className="customAddStageButton"
                  label="Add Stage"
                  icon="pi pi-plus"
                  onClick={() => {
                    validRequiredField("addStage");
                  }}
                />
              </div>
            </div>
            <div className={`${ApprovalWorkFlowStyles.stageConfigContainer}`}>
              <Label className={`${ApprovalWorkFlowStyles.label}`}>
                Stage Configuration
              </Label>
              <div className={`${ApprovalWorkFlowStyles.stageFormContainer}`}>
                <div className={`${ApprovalWorkFlowStyles.deleteStageButton}`}>
                  <Label
                    className={`${ApprovalWorkFlowStyles.stageConfigHeader}`}
                  >
                    {`Stage ${selectedStage?.["stage"]}`}
                  </Label>
                  {approvalFlowDetails?.stages.length > 1 && (
                    <Button
                      icon="pi pi-trash"
                      label="Remove"
                      visible={isEdit}
                      className="customAddStageButton"
                      onClick={() => {
                        removeStage(
                          approvalFlowDetails?.stages.findIndex(
                            (e) => e.stage === selectedStage?.["stage"]
                          )
                        );
                      }}
                    />
                  )}
                </div>
                <div>
                  <Label className={`${ApprovalWorkFlowStyles.label}`}>
                    People<span className="required">*</span>
                  </Label>
                  <PeoplePicker
                    context={context}
                    personSelectionLimit={3}
                    groupName={""}
                    showtooltip={true}
                    disabled={!isEdit}
                    ensureUser={true}
                    defaultSelectedUsers={approvalFlowDetails?.stages[
                      approvalFlowDetails?.stages.findIndex(
                        (e) => e.stage === selectedStage?.["stage"]
                      )
                    ]?.approver.map((approver) => approver.email)}
                    onChange={async (items) => {
                      await updateStage(
                        approvalFlowDetails?.stages.findIndex(
                          (e) => e.stage === selectedStage?.["stage"]
                        ),
                        "approver",
                        items
                      );
                      setValidation({ ...Config.ApprovalFlowValidation });
                    }}
                    principalTypes={[PrincipalType.User]}
                    resolveDelay={1000}
                  />
                </div>
                <div>
                  <Label className={`${ApprovalWorkFlowStyles.label}`}>
                    Type<span className="required">*</span>
                  </Label>
                  <Dropdown
                    width={"100%"}
                    disabled={!isEdit}
                    value={approvalType?.approvalFlowType.find(
                      (e) =>
                        e?.id ===
                        approvalFlowDetails?.stages[
                          approvalFlowDetails?.stages.findIndex(
                            (e) => e.stage === selectedStage?.["stage"]
                          )
                        ]?.approvalProcess
                    )}
                    options={approvalType?.approvalFlowType}
                    optionLabel="name"
                    onChange={async (e) => {
                      await updateStage(
                        approvalFlowDetails?.stages.findIndex(
                          (e) => e.stage === selectedStage?.["stage"]
                        ),
                        "approvalProcess",
                        e.value?.id
                      );
                      setValidation({ ...Config.ApprovalFlowValidation });
                    }}
                    placeholder="Select Type of Workflow"
                    style={{ marginTop: "0.5rem" }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={`${ApprovalWorkFlowStyles.buttonsDiv}`}>
            <>
              {isEdit && (
                <>
                  <Button
                    className="customCancelButton"
                    label="Cancel"
                    icon="pi pi-times"
                    onClick={() => {
                      setApprovalSideBarVisible(false);
                    }}
                  />
                  <Button
                    className="customSubmitButton"
                    label="Submit"
                    icon="pi pi-save"
                    onClick={() => {
                      validRequiredField("submit");
                    }}
                  />
                </>
              )}
              {!isEdit && (
                <Button
                  icon="pi pi-times"
                  label="Close"
                  className="customCancelButton"
                  onClick={() => {
                    setApprovalSideBarVisible(false);
                  }}
                />
              )}
            </>
          </div>
        </div>
      </div>
    </>
  );

  //useEffects

  useEffect(() => {
    if (!ApprovalConfigSideBarVisible) {
      setValidation({ ...Config.ApprovalFlowValidation });
      setCurrentRecord({
        id: null,
        category: [],
        apprvalFlowName: "",
        totalStages: null,
        rejectionFlow: "",
        stages: [],
      });
      setIsEdit(true);
      setApprovalFlowDetails({ ...Config.ApprovalConfigDefaultDetails });
    } else if (ApprovalConfigSideBarVisible) {
      if (currentRec?.id) {
        setApprovalFlowDetails({
          apprvalFlowName: currentRec?.apprvalFlowName,
          totalStages: currentRec?.totalStages,
          rejectionFlow: currentRec?.rejectionFlow,
          stages: currentRec?.stages,
        });
      }
    }
  }, [ApprovalConfigSideBarVisible]);
  useEffect(() => {
    if (approvalFlowDetails?.stages.length === 0) {
      setApprovalFlowDetails((prev: IApprovalDetailsPatch) => ({
        ...prev,
        stages: [
          {
            stage: 1,
            approvalProcess: null,
            approver: [],
          },
        ],
      }));
      setSelectedStage({
        stage: 1,
        approvalProcess: null,
        approver: [],
      });
    }
    setApprovalSideBarContent((prev: IRightSideBarContents) => ({
      ...prev,
      ApprovalConfigContent: ApprovalConfigSidebarContent(),
    }));
  }, [
    null,
    ApprovalConfigSideBarVisible,
    approvalFlowDetails,
    rejectionFlowChoice?.rejectionFlowDrop,
    validation,
    selectedStage,
  ]);
  useEffect(() => {
    getRejectionFlowChoices();
  }, []);

  return <>{showLoader ? <Loader /> : ""}</>;
};

export default ApprovalWorkFlow;
