//Default Export:
import * as React from "react";
import { useState, useEffect } from "react";
//Common Service Imports:
import SPServices from "../../../../../CommonServices/SPServices";
import { Config } from "../../../../../CommonServices/Config";
import {
  INextStageFromCategorySideBar,
  IPeoplePickerDetails,
} from "../../../../../CommonServices/interface";
//Prime React Imports:
import { Dropdown } from "primereact/dropdown";
import { Persona, PersonaSize } from "@fluentui/react";
import { Button } from "primereact/button";
//Styles Imports:
import ExistingApproverStyles from "./CategoryConfig.module.scss";

const ExistingApprover = ({
  category,
  setExistingApproverSideBarVisible,
  setSelectedApprover,
  setNextStageFromCategory,
}) => {
  //State Variables:
  const [approvalConfigDetails, setApprovalConfigDetails] = useState<any[]>([]);
  const [approvalFlowOptions, setApprovalFlowOptions] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  console.log(selectedFlow, "selectedFlow");
  const [selectedFlowID, setSelectedFlowID] = useState<number>(null);
  const [selectedFlowObj, setSelectedFlowObj] = useState<any>({});
  const [approvalStageConfigDetails, setApprovalStageConfigDetails] = useState<
    any[]
  >([]);

  //Initial Render:
  useEffect(() => {
    getApprovalConfigDetails();
  }, []);

  //Get Approval ConfigDetails:
  const getApprovalConfigDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames?.ApprovalConfig,
      Orderby: "Modified",
      Orderbydecorasc: false,
      Select: "*,Category/ID",
      Expand: "Category",
    })
      .then((res) => {
        const temApprovalConfigArray = [];
        const tempFlowNames = new Set();
        res.forEach((items: any) => {
          temApprovalConfigArray.push({
            id: items?.ID,
            categoryID: items?.CategoryId,
            approvalFlowName: items?.ApprovalFlowName,
            approvalProcess: items?.ApprovalProcess,
            rejectionFlow: items?.RejectionFlow,
          });
          if (items?.ApprovalFlowName) {
            tempFlowNames.add(items.ApprovalFlowName);
          }
        });
        setApprovalConfigDetails([...temApprovalConfigArray]);
        setApprovalFlowOptions(
          Array.from(tempFlowNames).map((flow) => ({
            label: flow,
            value: flow,
          }))
        );
      })
      .catch((err) => {
        console.log(err, "Get ApprovalConfig Details");
      });
  };

  //Get ApprovalStageConfigDetails Function Render:
  useEffect(() => {
    if (selectedFlowID !== null) {
      getApprovalStageConfigDetails();
    }
  }, [selectedFlowID]);

  //Get approvalStageConfig Details:
  const getApprovalStageConfigDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.ApprovalStageConfig,
      Orderby: "Modified",
      Orderbydecorasc: false,
      Select: "*,Approver/ID,Approver/EMail,Approver/Title",
      Expand: "Approver",
      Filter: [
        {
          FilterKey: "ParentApproval",
          Operator: "eq",
          FilterValue: selectedFlowID.toString(),
        },
      ],
    })
      .then((res) => {
        const tempApprovalStageConfigArr = [];
        res.forEach((items: any) => {
          let approver: IPeoplePickerDetails[] = [];
          if (items?.Approver) {
            items?.Approver.forEach((val) => {
              approver.push({
                id: val?.ID,
                name: val?.Title,
                email: val?.EMail,
              });
            });
          }
          tempApprovalStageConfigArr.push({
            stage: items?.Stage,
            approver,
            approvalProcess: items?.ApprovalProcess,
          });
        });
        setApprovalStageConfigDetails([...tempApprovalStageConfigArr]);
      })
      .catch((err) => {
        console.log(err, "Get ApprovalStageConfig Details");
      });
  };

  const handleFlowChange = (e: any) => {
    const selectedValue = e.value;
    setSelectedFlow(selectedValue);

    const selectedItem = approvalConfigDetails.find(
      (item) => item.approvalFlowName === selectedValue
    );

    setSelectedFlowObj(selectedItem ? selectedItem : "");
    setSelectedFlowID(selectedItem ? selectedItem.id : null);
  };

  return (
    <>
      <div className={`${ExistingApproverStyles.CategoryContainer}`}>
        <div className={`${ExistingApproverStyles.dropDownDiv}`}>
          <Dropdown
            value={selectedFlow}
            options={approvalFlowOptions}
            onChange={handleFlowChange}
            placeholder="Select Approval Flow"
            className={`${ExistingApproverStyles.dropDown}`}
          />
        </div>
        {selectedFlowObj?.rejectionFlow ? (
          <div className={`${ExistingApproverStyles.RejectionDiv}`}>
            {selectedFlowObj?.rejectionFlow}
          </div>
        ) : (
          ""
        )}
      </div>
      <div className={`${ExistingApproverStyles.approversContainer}`}>
        {approvalStageConfigDetails
          .sort((a, b) => a.stage - b.stage)
          .map((stageData) => (
            <div
              key={stageData.stage}
              className={`${ExistingApproverStyles.stageSection}`}
            >
              <h3>Stage {stageData.stage} approver</h3>
              <div
                className={`${ExistingApproverStyles.approvalMessage} ${
                  stageData.approvalProcess === 1
                    ? ExistingApproverStyles.onlyOne
                    : ExistingApproverStyles.everyone
                }`}
              >
                {stageData.approvalProcess === 1
                  ? "Only one should approve"
                  : "Everyone should approve"}
              </div>
              <div className={`${ExistingApproverStyles.approversList}`}>
                {stageData.approver.map((user: IPeoplePickerDetails) => (
                  <div
                    key={user.id}
                    className={`${ExistingApproverStyles.approversChip}`}
                  >
                    <Persona
                      text={user.name}
                      size={PersonaSize.size24}
                      imageUrl={`/_layouts/15/userphoto.aspx?size=L&username=${user.email}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
      <div className={`${ExistingApproverStyles.FlowSideBarButtons}`}>
        <Button
          icon="pi pi-times"
          label="Cancel"
          onClick={() => {
            setExistingApproverSideBarVisible(false);
            setSelectedApprover("");
            setNextStageFromCategory({
              ...Config.NextStageFromCategorySideBar,
            });
          }}
          className="customCancelButton"
        />

        <Button
          icon="pi pi-angle-double-right"
          label="Next"
          className="customSubmitButton"
          onClick={() => {
            setNextStageFromCategory((prev: INextStageFromCategorySideBar) => ({
              ...prev,
              dynamicSectionWithField: true,
              ApproverSection: false,
            }));
            // setSelectedApprover("");
          }}
        />
      </div>
    </>
  );
};

export default ExistingApprover;
