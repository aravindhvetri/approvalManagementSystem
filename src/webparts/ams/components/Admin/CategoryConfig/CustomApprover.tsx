//Default Export:
import * as React from "react";
import { useState, useEffect } from "react";
//Prime React Imports:
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { FaRegTrashAlt } from "react-icons/fa";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { Label } from "office-ui-fabric-react";
//Styles Imports:
import CustomApproverStyles from "./CategoryConfig.module.scss";
//Common Service Imports:
import {
  IApprovalDetailsPatch,
  IApprovalFlowValidation,
  IApprovalStages,
  IBasicDropDown,
  IDropdownDetails,
  IFinalSubmitDetails,
  IPeoplePickerDetails,
} from "../../../../../CommonServices/interface";
import { Config } from "../../../../../CommonServices/Config";
import SPServices from "../../../../../CommonServices/SPServices";
import { notesContainerDetails } from "../../../../../CommonServices/CommonTemplates";

const CustomApprover = ({
  categoryClickingID,
  actionBooleans,
  category,
  context,
  setCustomApproverSideBarVisible,
  setFinalSubmit,
}) => {
  //state Variables:
  const [approvalFlowDetails, setApprovalFlowDetails] =
    useState<IApprovalDetailsPatch>({
      ...Config.ApprovalConfigDefaultDetails,
    });
  const [validation, setValidation] = useState<IApprovalFlowValidation>({
    ...Config.ApprovalFlowValidation,
  });
  const [rejectionFlowChoice, setRejectionFlowChoice] =
    useState<IDropdownDetails>({
      ...Config.initialConfigDrop,
    });
  const [approvalType, setApprovalType] = useState<IDropdownDetails>({
    ...Config.initialConfigDrop,
  });
  const notes = [
    {
      info: "You can able to edit Approval process only on Approval Workflow",
    },
  ];
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
      })
      .catch((err) => {
        console.log("getRejectionFlowChoices error", err);
      });
  };

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
        setCustomApproverSideBarVisible(false);
      })
      .catch((err) => console.log("addApprovalConfigDetails error", err));
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
      .then((res: any) => {
        console.log("addApprovalStageConfigDetails res", res);
      })
      .catch((err) => console.log("addApprovalStageConfigDetails error", err));
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
    if (
      approvalFlowDetails?.apprvalFlowName.trim().length === 0 ||
      approvalFlowDetails?.rejectionFlow.trim().length === 0
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
      (action === "addStage" || action === "submit") &&
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
          ? addApprovalConfigDetails(approvalFlowDetails)
          : "";
      }
    }
  };

  //particular categoryID Details:
  const fetchCategoryDetails = async () => {
    try {
      const res: any = await SPServices.SPReadItems({
        Listname: Config.ListNames.ApprovalConfig,
        Select: "*",
        Filter: [
          {
            FilterKey: "Category",
            Operator: "eq",
            FilterValue: categoryClickingID.toString(),
          },
        ],
      });

      if (res.length > 0) {
        const matchedCategory = res[0];
        setApprovalFlowDetails({
          apprvalFlowName: matchedCategory.ApprovalFlowName || "",
          totalStages: matchedCategory.TotalStages || 0,
          rejectionFlow: matchedCategory.RejectionFlow || "",
          stages: await fetchApprovalStages(matchedCategory.ID),
        });
      } else {
        console.warn("No matching category found in ApprovalConfig");
        setApprovalFlowDetails(null);
      }
    } catch (err) {
      console.error("Error fetching category details", err);
    }
  };

  const fetchApprovalStages = async (parentId) => {
    try {
      const res: any = await SPServices.SPReadItems({
        Listname: Config.ListNames.ApprovalStageConfig,
        Select: "*,ParentApproval/Id,Approver/Id,Approver/EMail,Approver/Title",
        Expand: "ParentApproval,Approver",
        Filter: [
          {
            FilterKey: "ParentApprovalId",
            Operator: "eq",
            FilterValue: parentId.toString(),
          },
        ],
      });
      return res?.map((stage, index) => ({
        stage: index + 1,
        approvalProcess: stage?.ApprovalProcess || null,
        approver: stage?.Approver?.map((approver) => ({
          id: approver?.Id,
          name: approver.Title,
          email: approver.EMail,
        })),
      }));
    } catch (err) {
      console.error("Error fetching approval stages", err);
      return [];
    }
  };

  useEffect(() => {
    getRejectionFlowChoices();

    const storedData = sessionStorage.getItem("approvalFlowDetails");
    if (storedData) {
      setApprovalFlowDetails(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      "approvalFlowDetails",
      JSON.stringify(approvalFlowDetails)
    );

    setFinalSubmit((prev: IFinalSubmitDetails) => ({
      ...prev,
      categoryConfig: {
        ...prev.categoryConfig,
        category: category,
        customApprover: approvalFlowDetails,
      },
    }));
  }, [approvalFlowDetails]);

  useEffect(() => {
    if (categoryClickingID) {
      fetchCategoryDetails();
    }
  }, [categoryClickingID]);

  return (
    <>
      <div className={`${CustomApproverStyles.topSection}`}>
        <div className={`${CustomApproverStyles.nameDiv}`}>
          <Label className={`${CustomApproverStyles.label}`}>
            Name<span className="required">*</span>
          </Label>
          <InputText
            value={approvalFlowDetails?.apprvalFlowName}
            onChange={(e) => onChangeHandle("apprvalFlowName", e.target.value)}
            placeholder="Workflow Name"
            style={{ width: "100%" }}
            disabled={actionBooleans?.isEdit || actionBooleans?.isView}
          />
        </div>
        <div className={`${CustomApproverStyles.rejectDiv}`}>
          <Label className={`${CustomApproverStyles.label}`}>
            Rejection Process<span className="required">*</span>
          </Label>
          <Dropdown
            options={rejectionFlowChoice?.rejectionFlowDrop}
            value={rejectionFlowChoice?.rejectionFlowDrop.find(
              (e) => e?.name === approvalFlowDetails?.rejectionFlow
            )}
            optionLabel="name"
            onChange={(e) => onChangeHandle("rejectionFlow", e.value?.name)}
            placeholder="Select Reject Type"
            style={{ width: "100%" }}
            disabled={actionBooleans?.isEdit || actionBooleans?.isView}
          />
        </div>
      </div>
      <div>
        <span className="errorMsg">{validation?.approvalConfigValidation}</span>
      </div>
      {approvalFlowDetails?.stages?.map(function (stage, stageIndex) {
        return (
          <>
            <div key={stageIndex} style={{ marginTop: "20px" }}>
              <h4 className={`${CustomApproverStyles.label}`}>
                Stage {stage.stage} Approver<span className="required">*</span>
              </h4>
              <div className={`${CustomApproverStyles.stage}`}>
                <div>
                  <Label className={`${CustomApproverStyles.label}`}>
                    People
                  </Label>
                  <PeoplePicker
                    context={context}
                    personSelectionLimit={3}
                    disabled={actionBooleans?.isEdit || actionBooleans?.isView}
                    groupName={""}
                    showtooltip={true}
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
                  <Label className={`${CustomApproverStyles.label}`}>
                    Type
                  </Label>
                  <Dropdown
                    value={approvalType?.approvalFlowType.find(
                      (e) =>
                        e?.id ===
                        approvalFlowDetails?.stages[stageIndex].approvalProcess
                    )}
                    disabled={actionBooleans?.isEdit || actionBooleans?.isView}
                    options={approvalType?.approvalFlowType}
                    optionLabel="name"
                    onChange={(e) =>
                      updateStage(stageIndex, "approvalProcess", e.value?.id)
                    }
                    placeholder="Select Type of Workflow"
                    style={{ marginTop: "0.5rem" }}
                  />
                </div>
                {!(actionBooleans?.isEdit || actionBooleans?.isView) ? (
                  <div className={`${CustomApproverStyles.deleteDiv}`}>
                    <FaRegTrashAlt onClick={() => removeStage(stageIndex)} />
                  </div>
                ) : (
                  ""
                )}
              </div>
            </div>
            {validation?.stageErrIndex.some((e) => e === stageIndex) && (
              <div>
                <span className="errorMsg">{validation?.stageValidation}</span>
              </div>
            )}
          </>
        );
      })}
      {!(actionBooleans?.isEdit || actionBooleans?.isView) ? (
        <div className={`${CustomApproverStyles.addStageButton}`}>
          <Button
            style={{ padding: "5px" }}
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => validRequiredField("addStage")}
          />
        </div>
      ) : (
        ""
      )}
      {actionBooleans?.isEdit && (
        <div>{notesContainerDetails("Notes", notes)}</div>
      )}
    </>
  );
};

export default CustomApprover;
