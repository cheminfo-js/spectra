/**
 * Created by acastillo on 9/2/16.
 */
'use strict'
const DEBUG  = false;
class SpinSystem {
    constructor(diaIDsArray, signalsArray, opt){
        var options = Object.assign({}, opt);
        this.diaIDsArray = diaIDsArray;
        this.signalsArray = signalsArray;
        this.cosy = options.cosySignals || null;
        this.connCosy = options.cosyPaths || null;
        this.connHmbc = options.hmbcPaths || null;
        this.hmbc = options.hmbcSignals || null;
        this.init();
    }

    init(){
        const nDiaIds = this.diaIDsArray.length;
        const nSignals = this.signalsArray.length;
        const diaIDByAtomLabel = {};
        const indexByAtomLabel = {};
        var shiftsH = [];
        var shiftsC = [];
        var windowH = [];
        var windowC = [];

        var signals1D = this.signalsArray;
        var nH = 0, nC = 0, i = 0;
        try {
            this.chemicalShiftsT = new Array(nDiaIds);
            this.chemicalShiftsTError = new Array(nDiaIds);
            this.diaList = new Array(nDiaIds);
            var dia = null;
            for(i = 0; i < nDiaIds; i++) {
                dia = this.diaIDsArray[i];
                if(diaIDByAtomLabel[dia.atomLabel]) {
                    diaIDByAtomLabel[dia.atomLabel].push(dia.diaIDs[0]);
                    indexByAtomLabel[dia.atomLabel].push(i);
                }
                else {
                    diaIDByAtomLabel[dia.atomLabel] = [dia.diaIDs[0]];
                    indexByAtomLabel[dia.atomLabel] = [i];
                }
                this.diaList[i] = dia.integral;
                this.chemicalShiftsT[i] = dia.delta;
                this.chemicalShiftsTError[i] = dia.error || 0;
            }
            // We can't have more signals than different protons in the molecule if the integral
            // matches the nH
            this.signals = new Array(nSignals);
            this.chemicalShiftsE = new Array(nSignals);
            this.signalsWidth = new Array(nSignals);

            for(i = 0; i < nSignals; i++) {
                var from = signals1D[i].from;
                var to = signals1D[i].to;
                this.chemicalShiftsE[i] = (from+to)/2.0;
                this.signals[i] = Math.round(signals1D[i].integral);
                shiftsH.push((from+to)/2.0);
                windowH.push(Math.abs(from-to));
                this.signalsWidth[i] = Math.abs(from-to);
            }

            //System.out.println(diaIDsH.size());
            //var row,col;

            /*if(cosy.length()>0&&connCosy.length()>0){
                cosyT = new byte[nH][nH];
                //To parse the theoretical COSY
                for(int i=connCosy.length()-1;i>=0;i--){
                    JSONObject pair = (JSONObject) connCosy.get(i);
                    row=diaIDsH.indexOf(pair.getString("diaID1"));
                    col=diaIDsH.indexOf(pair.getString("diaID2"));
                    if(row>=0&&col>=0){
                        cosyT[row][col]=(byte)4;
                        if(pair.getInt("distance")==4)
                            cosyT[row][col]=(byte)2;
                    }
                }
                cosyE = new byte[nSignals][nSignals];
                double resolutionX = Double.MAX_VALUE/6;//((JSONObject)hmbc.get(0)).getDouble("resolutionX");
                if(((JSONObject)cosy.get(0)).has("resolutionX"))
                resolutionX = ((JSONObject)cosy.get(0)).getDouble("resolutionX");

                for(int i=cosy.length()-1;i>=0;i--){
                    double x = 0,y=0;
                    //JSONObject crossPeak = null;
                    if(cosy.get(i) instanceof JSONObject){
                        x=((JSONObject)cosy.get(i)).getDouble("shiftX");
                        y=((JSONObject)cosy.get(i)).getDouble("shiftY");
                    }
                    else{
                        if(cosy.get(i) instanceof NMRSignal2D){
                            x =((NMRSignal2D)cosy.get(i)).toJSON().getDouble("shiftX");
                            y =((NMRSignal2D)cosy.get(i)).toJSON().getDouble("shiftY");
                        }
                    }
                    row = getIndex(x,shiftsH,windowH, resolutionX);
                    col = getIndex(y,shiftsH,windowH, resolutionX);
                    if(row>=0&&col>=0)
                        cosyE[row][col]=1;
                }
                //To complete the missing diagonal signals
                for(int i=0;i<cosyE.length;i++)
                cosyE[i][i]=1;
            }

            if(hmbc.length()>0&&connHmbc.length()>0){
                hmbcT = new byte[nH][nC];
                //To parse the theoretical HMBC
                for(int i=connHmbc.length()-1;i>=0;i--){
                    JSONObject pair = (JSONObject) connHmbc.get(i);
                    row=diaIDsH.indexOf(pair.getString("diaID1"));
                    col=diaIDsC.indexOf(pair.getString("diaID2"));
                    if(row>=0&&col>=0)
                        hmbcT[row][col]=1;
                }


                for(int i=hmbc.length()-1;i>=0;i--){
                    //JSONObject crossPeak = null;
                    double y=0;//x=0;
                    if(hmbc.get(i) instanceof JSONObject){
                        //x=((JSONObject)hmbc.get(i)).getDouble("shiftX");
                        y=((JSONObject)hmbc.get(i)).getDouble("shiftY");
                    }
                    else{
                        if(hmbc.get(i) instanceof NMRSignal2D){
                            //crossPeak = (JSONObject) ((NMRSignal2D)hmbc.get(i)).toJSON().get("peaks");
                            //x =((NMRSignal2D)hmbc.get(i)).toJSON().getDouble("shiftX");
                            y =((NMRSignal2D)hmbc.get(i)).toJSON().getDouble("shiftY");
                        }
                    }
                    if(shiftsC.size()==0)
                        shiftsC.add(y);
                    else{
                        int index = shiftsC.binarySearch(y);
                        if(index<0)
                            shiftsC.beforeInsert(-(index+1), y);
                    }
                }
                if(DEBUG) System.out.println("shifts C : "+shiftsC);
                if(DEBUG)  System.out.println("diaIDs C : "+diaIDsC);
                shiftsC=fitCount(diaIDsC,shiftsC);
                if(DEBUG)  System.out.println("shifts C : "+shiftsC);
                hmbcE = new byte[nSignals][shiftsC.size()];
                double resolutionX = Double.MAX_VALUE/6;//((JSONObject)hmbc.get(0)).getDouble("resolutionX");
                if(((JSONObject)hmbc.get(0)).has("resolutionX"))
                resolutionX = ((JSONObject)hmbc.get(0)).getDouble("resolutionX");
                double resolutionY = Double.MAX_VALUE/6;//((JSONObject)hmbc.get(0)).getDouble("resolutionY");
                if(((JSONObject)hmbc.get(0)).has("resolutionY"))
                resolutionY = ((JSONObject)hmbc.get(0)).getDouble("resolutionY");
                for(int i=hmbc.length()-1;i>=0;i--){
                    //JSONObject crossPeak = null;
                    double x=0,y=0;
                    if(hmbc.get(i) instanceof JSONObject){
                        x=((JSONObject)hmbc.get(i)).getDouble("shiftX");
                        y=((JSONObject)hmbc.get(i)).getDouble("shiftY");
                    }
                    else{
                        if(hmbc.get(i) instanceof NMRSignal2D){
                            //crossPeak = (JSONObject) ((NMRSignal2D)hmbc.get(i)).toJSON().get("peaks");
                            x =((NMRSignal2D)hmbc.get(i)).toJSON().getDouble("shiftX");
                            y =((NMRSignal2D)hmbc.get(i)).toJSON().getDouble("shiftY");
                        }
                    }
                    //System.out.println(resolutionX+" "+resolutionY+" "+windowH);
                    row = getIndex(x,shiftsH, windowH, resolutionX);
                    col = getIndex(y,shiftsC, null, resolutionY);
                    //System.out.println(row+" , "+col);
                    if(row>=0&&col>=0)
                        hmbcE[row][col]=1;
                }
            }*/


        } catch (e) {
            // TODO Auto-generated catch block
            console.log("Exception in SpinSystem " + e);
        }
    }

    _getIndex(value, shifts, windows, resolution) {
        var minDiff = Number.MAX_VALUE;
        var index = shifts.length - 1;
        for(var i = shifts.length - 1; i >= 0; i--){
            if(Math.abs(value-shifts[i]) < minDiff) {
                minDiff = Math.abs(value - shifts[i]);
                index = i;
            }
        }
        if(windows) {
            if(minDiff <= windows[index]/2)
                return index;
        }
        if(minDiff <= Math.abs(resolution*4))
            return index;

        return -1;
    }

}

module.exports = SpinSystem;
