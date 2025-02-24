sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    "sap/ui/core/util/Export", 
    "sap/ui/core/util/ExportTypeCSV",
    "sap/m/Button",
    "sap/m/library",
    "sap/m/Dialog",
	"sap/m/MessageToast",
	"sap/m/Text",
    "sap/suite/ui/commons/ProcessFlow",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox",
    "sap/m/MessageItem",
    "sap/m/MessageView",
    "sap/m/Bar",
    "sap/m/Popover",
    "sap/ui/core/IconPool", 
    "sap/ui/core/Icon",
    "sap/m/Title"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Filter, FilterOperator, Export, ExportTypeCSV, Button, mobileLibrary, Dialog, MessageToast, Text, ProcessFlow, Fragment, JSONModel, BusyIndicator, MessageBox, MessageItem, MessageView, Bar, Popover, IconPool, Icon, Title ) {
        "use strict";
        
	    var ButtonType = mobileLibrary.ButtonType;
        var DialogType = mobileLibrary.DialogType;

        var vSoc = "";
        var vAno = "";
        var vMes = "";
        var vInd = 0;

        return Controller.extend("com.fidelidademundial.zfibalancetes.controller.upload", {
             onInit: function () {

            },

            handleLoadItems: function(oControlEvent) {
                oControlEvent.getSource().getBinding("items").resume();
            },
    
            handleValueStateLinkPress: function(oEvent) {
                MessageToast.show("Link in value state pressed");
            },

            handleUploadComplete: function(oEvent) {
                var sResponse = oEvent.getParameter("response"),
                    iHttpStatusCode = parseInt(/\d{3}/.exec(sResponse)[0]),
                    sMessage;
    
                if (sResponse) {
                    sMessage = iHttpStatusCode === 200 ? sResponse + " (Upload Success)" : sResponse + " (Upload Error)";
                    MessageToast.show(sMessage);
                }
            }, 
    
            ValidaFicheiro: function() {

                var vFile    = this.getView().byId("fileUploader").getValue();

                var fU = this.byId("fileUploader");
                var domRef = fU.getFocusDomRef();
                var file = domRef.files[0];

                if( vFile == "" )
                {
                    MessageToast.show("Nenhum ficheiro selecionado!", { duration: 1500	});
                    process.exit();
                };

                if( file.type != "text/csv" )
                {
                    MessageToast.show("Somente ficheiros com a extensão .csv serão aceitos", { duration: 1500	});
                    process.exit();
                };

            },

    
            ValidaTab: function() {

                var vTab    = this.getView().byId("cbTabs").getValue();

                if( vTab == "" )
                {
                    MessageToast.show("Nenhuma tabela indicada!", { duration: 1500	});
                    //return;
                    process.exit();
                };

            },            

            handlePreVisuPress: function() {

                var oMsgStrip = this.getView().byId("MsgStrip");

                this.ValidaFicheiro();

                var oModel      = this.getView().getModel();
                var oModelTab   = new sap.ui.model.json.JSONModel();
                var vTab        = this.getView().byId("cbTabs").getValue();
                var oTable      = this.getView().byId("CSVTable");

                var fU = this.byId("fileUploader");
                var domRef = fU.getFocusDomRef();
                var file = domRef.files[0];
	
                // Create a File Reader object
                var reader = new FileReader();
                var t = this;

                reader.onload = function(e) {
                    var strCSV = e.target.result;
                    var vDadosTratados = e.currentTarget.result;

                    var vDadosTratados = vDadosTratados.replaceAll(";;","; ;");
                    vDadosTratados = vDadosTratados.replaceAll(";\r\n","; \r\n");
                    vDadosTratados = vDadosTratados.replaceAll("\r\n;","\r\n ;");
 
                    var arrCSV = vDadosTratados.match(/[\w .]+(?=,?)/g);
                    var noOfCols = vDadosTratados.match(/[^\r\n]+/g)[0].split(";").length;

                    // To ignore the first row which is header
                    var hdrRow = arrCSV.splice(0, noOfCols);

                    var cabec   = [];
                    // extract header
                    
                    var objHd = {};
                    for (var i = 0; i < hdrRow.length; i++) {
                        // Adiciona campos do cabeçalho
                        objHd["columnName"] = hdrRow[i].trim()
                        cabec.push(objHd);
                        objHd = {};
                    }
                    
                    var data    = [];
                    while (arrCSV.length > 0) {
                    var obj = {};

                    // extract remaining rows one by one
                    var row = arrCSV.splice(0, noOfCols)
                    for (var i = 0; i < row.length; i++) {
                        obj[hdrRow[i]] = row[i].trim()
                    }
                    // Adiciona valores das colunas
                    data.push(obj)
                        
                    }

                    oModelTab.setData({
                        rows: data,
                        columns: cabec
                    });
                    // Bind the data to the Table
                    oTable.setModel(oModelTab);

                    oTable.bindColumns("/columns", function(sId, oContext) {
                        var columnName = oContext.getObject().columnName;
                        return new sap.ui.table.Column({
                            label: columnName,
                            template: columnName,
                        });
                    });
                    
                    oTable.bindRows("/rows");
                    oTable.setProperty("visible", true);

                };
                reader.readAsBinaryString(file);

            },    

            handleUploadPress: function() {
                
                var vBtnVal = this.getView().byId("BtnVal");

                // Oculta botão de Validações
                vBtnVal.setProperty("visible", false);

                var oMsgStrip = this.getView().byId("MsgStrip");
                oMsgStrip.setProperty("visible", false);

                var oModel      = this.getView().getModel();
                var vSociedade  = this.getView().byId("ComboSociedade").getValue();
                var vPerExerc   = this.getView().byId("TxtPeriodoExercicio").getValue();
                var oTable      = this.getView().byId("CSVTable"); 
                var vFlow       = this.getView().byId("FlowBalancetes");
                var vLnkContRes = this.getView().byId("LnkContRes");

                var vTxtNaoIni  = this.getView().getModel("i18n").getResourceBundle().getText("FlowStatusInicial");
                var vTxt04Suc  = this.getView().getModel("i18n").getResourceBundle().getText("MsgEtapa04Suc");
                var vTxt04Err  = this.getView().getModel("i18n").getResourceBundle().getText("MsgEtapa04Err");

                // Importação
                var vLane1      = vFlow.getLane("Etapa1");
                var vNode1      = vFlow.getNode("Node1");
                vLane1.setState([{ state: "Neutral", value: 1 }]);
                vNode1.setState("Neutral");                
                vNode1.setStateText(vTxtNaoIni);
                vNode1.setIsTitleClickable(false);  
                
                // Monitor
                var vLane2      = vFlow.getLane("Etapa2");
                var vNode2      = vFlow.getNode("Node2");
                vLane2.setState([{ state: "Neutral", value: 1 }]);
                vNode2.setState("Neutral");     
                vNode2.setStateText(vTxtNaoIni);    
                vNode2.setIsTitleClickable(false);    

                // Contabilização
                var vLane2_1      = vFlow.getLane("Etapa2_1");
                var vNode2_1      = vFlow.getNode("Node2_1");
                vLane2_1.setState([{ state: "Neutral", value: 1 }]);
                vNode2_1.setState("Neutral");     
                vNode2_1.setStateText(vTxtNaoIni);    
                vNode2_1.setIsTitleClickable(false);    

                // E-mail
                var vLane3      = vFlow.getLane("Etapa3");
                var vNode3      = vFlow.getNode("Node3");
                vLane3.setState([{ state: "Neutral", value: 1 }]);
                vNode3.setState("Neutral");           
                vNode3.setStateText(vTxtNaoIni);
                vNode3.setIsTitleClickable(false);  

                // Conclusão
                var vLane4      = vFlow.getLane("Etapa4");
                var vNode4      = vFlow.getNode("Node4");
                vLane4.setState([{ state: "Neutral", value: 1 }]);
                vNode4.setState("Neutral");           
                vNode4.setStateText(vTxtNaoIni);
                vNode4.setIsTitleClickable(false);  

                var vTeste;
                if ( this.getView().byId("ChkModoExec").mProperties.state == true )
                {
                    vTeste = 'X';
                }

                var vTesteCont;
                vLnkContRes.setProperty("enabled", false);
                if ( this.getView().byId("ChkModoExecCont").mProperties.state == true )
                {
                    vTesteCont = 'X';
                    vLnkContRes.setProperty("enabled", true);
                }
                

                var fU = this.byId("fileUploader");
                var domRef = fU.getFocusDomRef();
                var file = domRef.files[0];
                
                // Create a File Reader object
                var reader = new FileReader();
                var t = this;

                BusyIndicator.show();                

                reader.onload = function(e) {
                    
                    var strCSV = e.target.result;
                    var vDadosTratados = e.currentTarget.result;
                    var arrCSV = vDadosTratados.match(/[\w .]+(?=,?)/g);
                    var noOfCols = vDadosTratados.match(/[^\r\n]+/g)[0].split(";").length; 

                    // To ignore the first row which is header
                    var hdrRow = arrCSV.splice(0, noOfCols);

                    var data = [];
                    while (arrCSV.length > 0) {
                    var obj = {};
                    // extract remaining rows one by one
                    var row = arrCSV.splice(0, noOfCols)
                    for (var i = 0; i < row.length; i++) {
                        obj[hdrRow[i]] = row[i].trim()
                    }
                    // push row to an array
                    data.push(obj)
                    }

                    // Valida quantidade de linhas do Ficheiro
                    if ( data.length == 0 )
                    {
                        MessageToast.show("O ficheiro não possui registros para serem inseridos!", { duration: 1500	});
                        return;                        
                    }
                    
                    var oEntry = {};
                    oEntry.Filename     = fU.mProperties.value;
                    oEntry.Mimetype     = file.type;
                    oEntry.Sociedade    = vSociedade;
                    oEntry.Gjahr        = vPerExerc.substring(3, 7);
                    oEntry.Monat        = vPerExerc.substring(0, 2);
                    oEntry.Teste        = vTeste;
                    oEntry.TesteCont    = vTesteCont;
                    oEntry.TabData      = strCSV;

                    oModel.create("/zentfileSet", oEntry, {
                        success: function (odata, oResponse) {

                            vSoc = oResponse.data.Sociedade;
                            vAno = oResponse.data.Gjahr;
                            vMes = oResponse.data.Monat;
                            vInd = oResponse.data.Indice; 

                            if ( oResponse.data.ErrosVal )
                            {
                                vBtnVal.setProperty("visible", true);
                                BusyIndicator.hide();
                                return;
                            };

                            if ( oResponse.data.ErrosIntegracao != "" )
                            {
                                if ( vTeste == 'X' )
                                {
                                    MessageBox.information(oResponse.data.ErrosIntegracao, 
                                        { 
                                            title: "Execução em MODO TESTE",
                                            styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer" 
                                        });                                    
                                    // Exibe validações de Contabilização
                                    //this.ShowNode2_1();
                                }
                                else
                                {
                                oMsgStrip.setType("Error");
                                oMsgStrip.setText(oResponse.data.ErrosIntegracao);
                                oMsgStrip.setProperty("visible", true);
                                }
                            }
                            else
                            {

                            // IMPORTAÇÃO
                            if ( oResponse.data.Sucessos > 0 )
                            {
                                vLane1.setState([{ state: "Positive", value: 1 }]);
                                vNode1.setState("Positive");

                                vLane4.setState([{ state: "Positive", value: 1 }]);
                                vNode4.setState("Positive");   
                                vNode4.setStateText(vTxt04Suc);           
                                vNode4.setIsTitleClickable(true);                       
                            }
                            else if ( oResponse.data.Erros > 0 )
                            {
                                vLane1.setState([{ state: "Negative", value: 1 }]);
                                vNode1.setState("Negative");

                                vLane4.setState([{ state: "Negative", value: 1 }]);
                                vNode4.setState("Negative");                                
                                vNode4.setStateText(vTxt04Err);
                                vNode4.setIsTitleClickable(false);    
                            }

                            if ( vNode1.getState() != "Neutral" )
                            {
                                vNode1.setIsTitleClickable(true);
                                vNode1.setStateText(oResponse.data.ImpDesc);
                            }

                            // MONITOR
                            if ( oResponse.data.SucessosMon > 0 )
                            {
                                vLane2.setState([{ state: "Positive", value: 1 }]);
                                vNode2.setState("Positive");
                            }
                            else if ( oResponse.data.ErrosMon > 0 )
                            {
                                vLane2.setState([{ state: "Negative", value: 1 }]);
                                vNode2.setState("Negative");
                            }

                            if ( vNode2.getState() != "Neutral" )
                            {
                                vNode2.setIsTitleClickable(true);
                                vNode2.setStateText(oResponse.data.MonDesc);
                            }

                            // CONTABILIZAÇÃO
                            if ( oResponse.data.SucessosCont > 0 )
                                {
                                    vLane2_1.setState([{ state: "Positive", value: 1 }]);
                                    vNode2_1.setState("Positive");
                                }
                                else if ( oResponse.data.ErrosCont > 0 )
                                {
                                    vLane2_1.setState([{ state: "Negative", value: 1 }]);
                                    vNode2_1.setState("Negative");
                                }
    
                                if ( vNode2_1.getState() != "Neutral" )
                                {
                                    vNode2_1.setIsTitleClickable(true);
                                    vNode2_1.setStateText(oResponse.data.ContDesc);
                                }

                            // ENVIO DE E-MAILS
                            if ( oResponse.data.Email == true && oResponse.data.EmailDesc.length != "" )
                            {
                                vLane3.setState([{ state: "Positive", value: 1 }]);
                                vNode3.setState("Positive");
                                vNode3.setStateText(oResponse.data.EmailDesc);
                            }
                            else if ( !oResponse.data.Email && oResponse.data.EmailDesc.length != "" )
                            {
                                vLane3.setState([{ state: "Negative", value: 1 }]);
                                vNode3.setState("Negative");                 
                                vNode3.setStateText(oResponse.data.EmailDesc);               
                            }                                

                            if ( vNode3.getState() != "Neutral" )
                            {
                                vNode3.setIsTitleClickable(true);
                                vNode3.setStateText(oResponse.data.EmailDesc);
                            }                                

                            }

                            
                            oTable.setProperty("visible", false);
                            BusyIndicator.hide();
                        },
                        error: function (oError) {
                            var disMsg = jQuery.parseJSON(oError.responseText).error.message.value;
                            BusyIndicator.hide();
                            console.log("Erro: " + disMsg)
                        }
                    } 
                ); 

                };
                reader.readAsBinaryString(file);
            },            

            ViewValidations: function (oEvent) {
                var oDadosDet = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZGW_BALANCETES_SRV", true),
                    oModel = new JSONModel(),
                    vEvent = oEvent.getSource();

                    var that = this;

                    var oMessageTemplate = new MessageItem({
                        type: '{TypeVal}',
                        title: '{TitVal}',
                        description: '{DescVal}',
                        subtitle: '{SubtitVal}',
                        groupName: '{GrpVal}'
                    });

                oDadosDet.read("/zentValidationsSet?$format=json", {
                    
                    success: function (oData, response) {
                        
                         this.oMessageView = new MessageView({
                            showDetailsPageHeader: false,
                            itemSelect: function () {
                                oBackButton.setVisible(true);
                            },
                            items: {
                                path: "/",
                                template: oMessageTemplate
                            },
                            groupItems: true
                        });

                        var oBackButton = new Button({
                            icon: IconPool.getIconURI("nav-back"),
                            visible: false,
                            press: function () {
                                that.oMessageView.navigateBack();
                                that._oPopover.focus();
                                this.setVisible(false);
                            }
                        });
                        
                        oModel.setData(oData.results);
                        this.oMessageView.setModel(oModel);

                        var oCloseButton =  new Button({
                            text: "Close",
                            press: function () {
                                that._oPopover.close();
                            }
                        }).addStyleClass("sapUiTinyMarginEnd"),
                        oPopoverFooter = new Bar({
                            contentRight: oCloseButton
                        }),
                        oPopoverBar = new Bar({
                            contentLeft: [oBackButton],
                            contentMiddle: [
                                new Title({text: "Validações"})
                            ]
                        });
                            
                        this._oPopover = new Popover({
                            customHeader: oPopoverBar,
                            contentWidth: "440px",
                            contentHeight: "440px",
                            verticalScrolling: false,
                            modal: true,
                            content: [this.oMessageView],
                            footer: oPopoverFooter
                        });                       
                        
                        this._oPopover.openBy(vEvent);

                    }.bind(this),
                    error: function (err) {

                    }
                }
                );

//                this.oMessageView.navigateBack();
                /* if ( this._oPopover != undefined )                
                {
                    this._oPopover.openBy(oEvent.getSource());
                }; */

            },

            onNodePress: function (event) {

                var vNode   = event.getParameters().getNodeId(),
                    vState  = event.getParameters().mProperties.state,
                    vClick  = event.getParameters().mProperties.isTitleClickable,
                    oSource = event.getSource(),
                    oView   = this.getView(),
                    oDadosDet = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZGW_BALANCETES_SRV", true);

                // Se o estado da etapa for Neutro, não abrirá o fragmento
                if ( vState == "Neutral" || (!vClick) ) { return; }

                switch(vNode) {
                    /// Importação
                    case "Node1":

                            oDadosDet.read("/zentimplogSet?$filter=Sociedade eq '"+ vSoc +"' and Gjahr eq '"+ vAno +"' and Monat eq '"+ vMes +"' and Indice eq " + vInd, {
            
                                success: function (oData, response) {
                                    this.WriteDataDet(oData);
                                }.bind(this),
                                error: function (err) {
                                    sap.ui.core.BusyIndicator.hide();
                                }
                            }
                            );

                            if (!this._pPopover01) {
                                this._pPopover01 = Fragment.load({
                                    id: oView.getId(),
                                    name: "com.fidelidademundial.zfibalancetes.view.etapa01",
                                    controller: this
                                }).then(function(oPopover) {
                                    oView.addDependent(oPopover);
                                    return oPopover;
                                });
                            }
                            this._pPopover01.then(function(oPopover) {
                                oPopover.openBy(oSource);
                            });

                        break;
                    /// Monitor
                    case "Node2":

                            oDadosDet.read("/zentmonloggrpSet?$format=json&$expand=zentmonlogtaskSet&$filter=Sociedade eq '"+ vSoc +"' and Gjahr eq '"+ vAno +"' and Monat eq '"+ vMes + "'", {
                    
                                success: function (oData, response) {
                                    this.WriteDataDetTree(oData);
                                }.bind(this),
                                error: function (err) {
                                    sap.ui.core.BusyIndicator.hide();
                                }
                            }
                            );

                            if (!this._pPopover02) {
                                this._pPopover02 = Fragment.load({
                                    id: oView.getId(),
                                    name: "com.fidelidademundial.zfibalancetes.view.etapa02",
                                    controller: this
                                }).then(function(oPopover) {
                                    oView.addDependent(oPopover);
                                    return oPopover;
                                });
                            }
                            this._pPopover02.then(function(oPopover) {
                                oPopover.openBy(oSource);
                            });                    
                      
                      break;
                    /// Contabilização
                    case "Node2_1":

                            oDadosDet.read("/zentcontlogSet?$filter=Sociedade eq '"+ vSoc +"' and Gjahr eq '"+ vAno +"' and Monat eq '"+ vMes + "'", {
                    
                                success: function (oData, response) {
                                    this.WriteDataDet(oData);
                                }.bind(this),
                                error: function (err) {
                                    sap.ui.core.BusyIndicator.hide();
                                }
                            }
                            );

                            if (!this._pPopover02_1) {
                                this._pPopover02_1 = Fragment.load({
                                    id: oView.getId(),
                                    name: "com.fidelidademundial.zfibalancetes.view.etapa02_1",
                                    controller: this
                                }).then(function(oPopover) {
                                    oView.addDependent(oPopover);
                                    return oPopover;
                                });
                            }
                            this._pPopover02_1.then(function(oPopover) {
                                oPopover.openBy(oSource);
                            });                    
                      
                      break;
                      /// E-mails
                      case "Node3":
                      
                            oDadosDet.read("/zentmaillistlogSet", {
                            
                                success: function (oData, response) {
                                    this.WriteDataDet(oData);
                                }.bind(this),
                                error: function (err) {
                                    sap.ui.core.BusyIndicator.hide();
                                }
                            }
                            );

                            if (!this._pPopover03) {
                                this._pPopover03 = Fragment.load({
                                    id: oView.getId(),
                                    name: "com.fidelidademundial.zfibalancetes.view.etapa03",
                                    controller: this
                                }).then(function(oPopover) {
                                    oView.addDependent(oPopover);
                                    return oPopover;
                                });
                            }
                            this._pPopover03.then(function(oPopover) {
                                oPopover.openBy(oSource);
                            });   

                      break;
                      /// Conclusão
                      case "Node4":
                        
                        var finalUrl = window.location.href.split("#")[0] + "#zfibalancetesreport-display";
                        sap.m.URLHelper.redirect(finalUrl, true);

                      break;
                  }                

            },

            WriteDataDet: function (results) {
				
				var oModelRes = new JSONModel();
				oModelRes.setData(results);
				this.getView().setModel(oModelRes, "resultados");

			},

            WriteDataDetTree: function (results) {

                var aGrupos = []; 
                var aTasks  = []; 

                var aGrp    = results.results;
				
				var oModelRes = new JSONModel();
				
                for (var i = 0; i < results.results.length; i++) {  

                    aTasks = [];

                    /// Monta Tarefas
                    for (var y = 0; y < results.results[i].zentmonlogtaskSet.results.length; y++) {  
                        aTasks.push( 
                                        { 
                                            ZmonGrupo: results.results[i].zentmonlogtaskSet.results[y].ZmonGrupo, 
                                            ZmonStatus: results.results[i].zentmonlogtaskSet.results[y].ZmonStatus,  
                                            ZmonDescr: results.results[i].zentmonlogtaskSet.results[y].ZmonDescr
                                        }
                                    );              
                    }

                    /// Monta Grupos e Tarefas
                    aGrupos.push( 
                                    { 
                                        ZmonGrupo: aGrp[i].ZmonGrupo,
                                        tasks: aTasks
                                    } 
                                );              
                    

                };                
                
                oModelRes.setData(aGrupos);
				this.getView().setModel(oModelRes, "resultados");

			},            

            ValidaMandatorios: function (oFail) {

                var vSociedade  = this.getView().byId("ComboSociedade").getValue();
                if ( vSociedade == "" ) { MessageToast.show("Sociedade não preenchida!"); oFail = true; return oFail; }

                var vPerExerc   = this.getView().byId("TxtPeriodoExercicio").getValue();
                if ( vPerExerc == "" ) { MessageToast.show("Período/Exercício não preenchido!"); oFail = true; return oFail; }

                var fU = this.byId("fileUploader");
                var domRef = fU.getFocusDomRef();
                if ( domRef.files.length == 0 ) { MessageToast.show("Ficheiro não preenchido!"); oFail = true; return oFail; }                
            
            },

            onApproveDialogPress: function () {

                var oFail = false;
                oFail = this.ValidaMandatorios(oFail);

                if (oFail)
                {
                    return;
                }

                //this.ValidaFicheiro();                

                if (!this.oApproveDialog) {
                    this.oApproveDialog = new Dialog({
                        type: DialogType.Message,
                        title: "Confirmação",
                        content: new Text({ text: "Seguir com a importação do Balancete?" }),
                        beginButton: new Button({
                            type: ButtonType.Emphasized,
                            text: "Continuar",
                            press: function () {
                                this.oApproveDialog.close();
                                this.handleUploadPress();
                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: "Cancelar",
                            press: function () {
                                this.oApproveDialog.close();
                            }.bind(this)
                        })
                    });
                }
    
                this.oApproveDialog.open();
            },

            pressTest: function (event){
                var vExecCont = this.getView().byId("ChkModoExecCont");
                
                if ( this.getView().byId("ChkModoExec").mProperties.state == true )
                {
                    vExecCont.setProperty("state", true);
                }
                else
                {
                    vExecCont.setProperty("state", false);                
                };

            },

            ShowNode2_1: function (event)
            {

                var oSource = event.getSource(),
                    oView   = this.getView(),
                    oDadosDet = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZGW_BALANCETES_SRV", true);

                ///oDadosDet.read("/zentcontlogSet?$filter=Sociedade eq '"+ vSoc +"' and Gjahr eq '"+ vAno +"' and Monat eq '"+ vMes + "'", {
                oDadosDet.read("/zentcontlogSet", {
                    
                    success: function (oData, response) {
                        this.WriteDataDet(oData);
                    }.bind(this),
                    error: function (err) {
                        sap.ui.core.BusyIndicator.hide();
                    }
                }
                );

                if (!this._pPopover02_1) {
                    this._pPopover02_1 = Fragment.load({
                        id: oView.getId(),
                        name: "com.fidelidademundial.zfibalancetes.view.etapa02_1",
                        controller: this
                    }).then(function(oPopover) {
                        oView.addDependent(oPopover);
                        return oPopover;
                    });
                }
                this._pPopover02_1.then(function(oPopover) {
                    oPopover.openBy(oSource);
                });       

            }

        });
    });
