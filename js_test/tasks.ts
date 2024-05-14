import {message, result} from "@permaweb/aoconnect"
import {TOKEN_PROCESS, TASK_PROCESS} from "./constants"
import {getSigner, getWalletAddress, getTag} from "./utils"
import {testRegistry as registerData, testAllData, testDelete as deleteData} from "./dataregistry"
import {registerAllNodes, testGetAllNodes, deleteAllNodes, testAddWhiteList, testGetWhiteList, testRemoveWhiteList} from "./noderegistry"

interface ClearInfo {
    whiteList: boolean,
    node: boolean,
    data: boolean,
}

async function transferTokenToTask(quantity: string, signer: any) {
    let action = "Transfer"

    let msgId = await message({
        "process": TOKEN_PROCESS,
        "signer": signer,
        "tags": [
            {"name": "Action", "value": action},
            {"name": "Recipient", "value": TASK_PROCESS},
            {"name": "Quantity", "value": quantity},
        ]
    });

    let Result = await result({
        "process": TOKEN_PROCESS,
        "message": msgId,
    });
    if (Result.Error) {
        console.log(Result.Error)
    }
    let Messages = Result.Messages
    if (getTag(Messages[0], "Error")) {
        throw getTag(Messages[0], "Error")
    }
    console.log("transfer result: ", Messages[0].Data)
}
async function testSubmit(dataId: string, nodes: string[], signer: any) {
    let action = "Submit"
    let taskType = "task type"
    let inputData = Date() 
    let computeLimit = "200"
    let memoryLimit = "300"
    let encodedNodes = JSON.stringify(nodes)

    let msgId = await message({
        "process": TASK_PROCESS,
        "signer": signer,
        "tags": [
            {"name": "Action", "value": action},
            {"name": "TaskType", "value": taskType},
            {"name": "ComputeLimit", "value": computeLimit},
            {"name": "MemoryLimit", "value": memoryLimit},
            {"name": "ComputeNodes", "value": encodedNodes},
            {"name": "DataId", "value": dataId},
        ],
        "data": inputData
    });

    let Result = await result({
        "process": TASK_PROCESS,
        "message": msgId,
    });
    
    if (Result.Error) {
        console.log(Result.Error)
    }
    let Messages = Result.Messages
    if (getTag(Messages[0], "Error")) {
        throw getTag(Messages[0], "Error")
    }
    // console.log(Messages)
    const address = await getWalletAddress()
    console.log(address)
    for (const msg of Messages) {
        if (msg.Target === address) {
            return msg.Data
        }
    }
    return null;
}

async function testGetTasks(action: string, signer: any) {
    let msgId = await message({
        "process": TASK_PROCESS,
        "signer": signer,
        "tags": [
            {"name": "Action", "value": action},
        ],
    });

    let Result = await result({
        "process": TASK_PROCESS,
        "message": msgId,
    });
    if (Result.Error) {
        console.log(Result.Error)
    }
    let Messages = Result.Messages
    if (getTag(Messages[0], "Error")) {
        throw getTag(Messages[0], "Error")
    }
    return Messages[0].Data
}

async function testGetPendingTasks(signer: any) {
    let pendingTasks =  await testGetTasks("GetPendingTasks", signer)
    console.log(`pendingTasks: ${pendingTasks}`)
    return pendingTasks
}

async function testGetCompletedTasks(signer: any) {
    let completedTasks =  await testGetTasks("GetCompletedTasks", signer)
    console.log(`completedTasks: ${completedTasks}`)
    return completedTasks
}

async function testGetAllTasks(signer: any) {
    let allTasks =  await testGetTasks("GetAllTasks", signer)
    console.log(`allTasks: ${allTasks}`)
    return allTasks
}
async function testGetCompletedTaskById(taskId: string, signer: any) {
    let action = "GetCompletedTaskById"
    let msgId = await message({
        "process": TASK_PROCESS,
        "signer": signer,
        "tags": [
            {"name": "Action", "value": action},
            {"name": "TaskId", "value": taskId},
        ]
    })

    let Result = await result({
        "process": TASK_PROCESS,
        "message": msgId,
    })
    if (Result.Error) {
        console.log(Result.Error)
    }
    let Messages = Result.Messages
    if (getTag(Messages[0], "Error")) {
        throw getTag(Messages[0], "Error")
    }
    return Messages[0].Data
}

async function getExpectedMessage(Messages: any[]) {
    let address = await getWalletAddress()
    console.log("address ", address)
    // console.log("messages ", Messages)
    let targets = []
    for (let msg of Messages) {
        targets.push(msg.Target)
        if (msg.Target === address) {
            return msg;
        }
    }
    console.log(targets)
    return null
}

async function testReportResult(node:string, taskId:string, signer:any) {
    let action = "ReportResult"
    let computeResult = "compute result"

    let msgId = await message({
        "process": TASK_PROCESS,
        "signer": signer,
        "tags": [
            {"name": "Action", "value": action},
            {"name": "TaskId", "value": taskId},
            {"name": "NodeName", "value": node},
        ],
        "data": computeResult
    });

    let Result = await result({
        "process": TASK_PROCESS,
        "message": msgId,
    });
    if (Result.Error) {
        console.log(Result.Error)
    }
    let Messages = Result.Messages
    let Message = await getExpectedMessage(Messages)
    if (Message == null) {
        for (let msg of Messages) {
            console.log(msg)
            console.log(msg.Tags)
        }
    }
    if (getTag(Message, "Error")) {
        throw getTag(Message, "Error")
    }
    return Message.Data
}
async function testReportAllResult(taskId: string, signer: any) {
    let pendingTasks = await testGetPendingTasks(signer)
    let pendingTasks2 = JSON.parse(pendingTasks)

    for (let pendingTask of pendingTasks2) {
        if (pendingTask.id === taskId) {
            for (const node in pendingTask.computeNodeMap) {
                let res = await testReportResult(node, taskId, signer)
                console.log(`${node} result: ${res}`)
            }
        }
    }
}
async function testBalance(address: string, signer: any) {
    let action = "Balance"

    let msgId = await message({
        "process": TOKEN_PROCESS,
        "signer": signer,
        "tags": [
            {"name": "Action", "value": action},
            {"name": "Recipient", "value": address},
        ]
    });

    let Result = await result({
        "process": TOKEN_PROCESS,
        "message": msgId,
    });

    if (Result.Error) {
        console.log(Result.Error)
    }
    let Messages = Result.Messages
    if (getTag(Messages[0], "Error")) {
        throw getTag(Messages[0], "Error")
    }
    console.log("Balance: ", Messages[0].Data)
    return Messages[0].Data
}
async function testAllowance(signer: any) {
    let action = "Allowance"

    let msgId = await message({
        "process": TASK_PROCESS,
        "signer": signer,
        "tags": [
            {"name": "Action", "value": action},
        ]
    });
    let Result = await result({
        "process": TASK_PROCESS,
        "message": msgId,
    });
    if (Result.Error) {
        console.log(Result.Error)
    }
    let Messages = Result.Messages
    if (getTag(Messages[0], "Error")) {
        throw getTag(Messages[0], "Error")
    }
    // console.log(Messages)
    console.log("allowance: ", Messages[0].Data)
    return Messages[0].Data
}
async function testWithdraw(quantity: string, signer: any) {
    let action = "Withdraw"

    let msgId = await message({
        "process": TASK_PROCESS,
        "signer": signer,
        "tags": [
            {"name": "Action", "value": action},
            {"name": "Quantity", "value": quantity},
        ]
    });
    let Result = await result({
        "process": TASK_PROCESS,
        "message": msgId,
    })
    if (Result.Error) {
        console.log(Result.Error)
    }
    let Messages = Result.Messages
    if (getTag(Messages[0], "Error")) {
        throw getTag(Messages[0], "Error")
    }
    let Message = await getExpectedMessage(Messages)
    console.log("withdraw: ", Message.Data)
    return Message.Data
}

async function withdraw(address: string, signer: any) {
    await testBalance(address, signer)
    await testBalance(TASK_PROCESS,signer)

    let allowance = await testAllowance(signer)
    let freeAllowance = JSON.parse(allowance).free
    if (freeAllowance !== "0") {
        await testWithdraw(freeAllowance, signer)
        await testBalance(address, signer)
        await testBalance(TASK_PROCESS, signer)
    }
}

async function clear(clearInfo: ClearInfo, signer: any) {
    if (clearInfo.whiteList) {
        let validAddresses = await testGetWhiteList(signer)
        console.log(typeof validAddresses, validAddresses)
        let whiteList = JSON.parse(validAddresses)
        for (const address of whiteList) {
            await testRemoveWhiteList(address, signer)
        }
    }

    if (clearInfo.node) {
        let registeredNodes = await testGetAllNodes(signer)
        console.log("registeredNodes", typeof registeredNodes, registeredNodes)
        let nodes = JSON.parse(registeredNodes) 
        let nodeNames = []
        for (const node of nodes) {
            nodeNames.push(node.name)
        }
        await deleteAllNodes(nodeNames, signer);
    }

    if (clearInfo.data) {
        let registeredData = await testAllData(signer)
        console.log("registeredData", typeof registeredData, registeredData)
        let allData = JSON.parse(registeredData)
        for (const data of allData) {
            await deleteData(data.id, signer);
        }
    }
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
    const signer = await getSigner()
    let address = await getWalletAddress()
    const nodes = ["js_aos1", "js_aos2", "js_aos3"]
    let clearInfo = {"whiteList": true, "node": true, "data": true}
    await clear(clearInfo, signer)

    await testAddWhiteList(address, signer)
    await testGetWhiteList(signer)
    await registerAllNodes(nodes, signer);

    let dataId = await registerData(signer)

    await testAllowance(signer)
    await testBalance(address, signer)
    await testBalance(TASK_PROCESS, signer)
    await transferTokenToTask("5", signer)

    // clearInfo = {"whiteList": false, "node": true, "data": false}
    // await clear(clearInfo, signer)
    await sleep(5000)

    let taskId = await testSubmit(dataId, nodes, signer)
    console.log(`task id: ${taskId}`)

    await sleep(5000)

    let pendingTasks = await testGetPendingTasks(signer)
    let pendingTasks2 = JSON.parse(pendingTasks)
    let taskIds = []
    for (const theTask of pendingTasks2) {
        taskIds.push(theTask.id)
    }
    console.log("taskIds ", taskIds)

    for (const taskId of taskIds) {
        await testReportAllResult(taskId, signer)
        await sleep(5000)
    }
    
    if (false) {
        await testGetCompletedTasks(signer)
        await testGetAllTasks(signer)
    }
    for (const taskId of taskIds) {
        await testGetCompletedTaskById(taskId, signer)
    }

    await deleteData(dataId, signer);
    await deleteAllNodes(nodes, signer);
    console.log(new Date())
    await testRemoveWhiteList(address, signer)

    await withdraw(address, signer)

    return "finished"
}
main().then((msg) => {
    console.log("then: ", msg)
})
.catch((e) => {
    console.log("catch: ", e)
})
