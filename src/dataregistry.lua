AllData = AllData or {}

function get_data_key(msg)
  return msg.Id
end

function get_data_delete_key(msg)
  return msg.DeleteId
end

Handlers.add(
  "register",
  Handlers.utils.hasMatchingTag("Action", "Register"),
  function (msg)
    if msg.DataTag == nil then
      Handlers.utils.reply("DataTag is required")(msg)
      return
    end

    if msg.Price == nil then
      Handlers.utils.reply("Price is required")(msg)
      return
    end

    if msg.Nonce == nil then
      Handlers.utils.reply("Nonce is required")(msg)
      return
    end

    if msg.EncMsg == nil then
      Handlers.utils.reply("EncMsg is required")(msg)
      return
    end

    local data_key = get_data_key(msg)
    if AllData[data_key] ~= nil then
      Handlers.utils.reply("already registered")(msg)
      return
    end

    AllData[data_key] = {}
    AllData[data_key].id = msg.Id
    AllData[data_key].dataTag = msg.DataTag
    AllData[data_key].price = msg.Price
    AllData[data_key].encSks = msg.Data
    AllData[data_key].nonce = msg.Nonce
    AllData[data_key].encMsg = msg.EncMsg
    AllData[data_key].from = msg.From
    Handlers.utils.reply(msg.Id)(msg)
  end
)

Handlers.add(
  "delete",
  Handlers.utils.hasMatchingTag("Action", "Delete"),
  function (msg)
    if msg.DeleteId == nil then
      Handlers.utils.reply("DeleteId is required")(msg)
      return
    end

    local data_key = get_data_delete_key(msg)
    if AllData[data_key] == nil then
      Handlers.utils.reply("record " .. data_key .. " not exist")(msg)
      return
    end

    if AllData[data_key].from ~= msg.From then
      Handlers.utils.reply("forbiden to delete")(msg)
      return
    end

    AllData[data_key] = nil
    Handlers.utils.reply("deleted")(msg)

  end
)

Handlers.add('allData', Handlers.utils.hasMatchingTag('Action', 'AllData'),
  function(msg) Send({ Target = msg.From, Data = require('json').encode(AllData) }) end)