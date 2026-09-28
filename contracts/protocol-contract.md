# 协议契约（Protocol Contract）

> **层**：L3 游戏侧（本仓 `contracts/`）　|　**状态**：v0.1 首版（Phase 0）
> **真源**：本文件。客户端与服务端**双向**只读消费。
> **来源**：从 Codex 原型的 `MessageTypes` + `docs/03-protocol-and-api.md`（216 行）**提炼**，非新设计。
> **战略地位**：服务端**重写 Go**（已定）时，**Java 侧最有价值的产出就是本契约**（协议 + 数据表）——那 22 个 Spring 服务会被丢弃，本契约不会。

---

## 0. 三条总原则

1. **服务端权威** —— 一切结算（战斗、突破、强化、掉落、打坐累计灵力）**由服务端算**，客户端只上报意图。
   > 例外（已知）：突破为**本地即时结算 + 上报**（体验优先），服务端回 `breakthrough_result` 覆盖。
2. **推拉分离** —— 请求/响应走 `type` 配对；**广播**（他人动作）走独立 `type`，不请求也收。
3. **分线广播** —— `player_joined` / `player_move` / `player_left` / `combat_hit` / `spell_effect` 等**仅发往同场景（`sceneId`）玩家**；跨场景互不可见。

---

## 1. WebSocket（客户端 ↔ 服务端）

**路径**：`/ws`　|　**格式**：JSON（统一消息信封）

```json
{ "type": "login", "data": { "username": "zhang", "password": "123456" } }
```

| 字段 | 规则 |
|---|---|
| `type` | **snake_case**，请求与响应不共用词表（见 §2 / §3） |
| `data` | 对象；无参数时传 `{}`（**不省略 `data`**） |

**鉴权**：`login_ok` 返回 `token`；`enter_world` **必须携带**；`token` 不匹配则拒绝（旧客户端未带 `token` 兼容放行）。

---

## 2. 请求类型（客户端 → 服务端）

### 2.1 账号与角色

| `type` | `data` | 说明 |
|---|---|---|
| `ping` | `{}` | 心跳 |
| `register` | `{username, password, email}` | 游戏内注册 |
| `login` | `{username, password}` | 登录（账号不存在则报错） |
| `list_characters` | `{playerId}` | 列出该账号角色 |
| `create_character` | `{playerId, name, gender}` | 建角；`gender 0=男/1=女`；**随机灵根/资质/体质/纯度** |
| `logout` | `{}` | 离开世界（广播 `player_left`）并返回登录态；**会话保留**，可重新登录 |

### 2.2 世界与移动

| `type` | `data` | 说明 |
|---|---|---|
| `enter_world` | `{characterId, token, sceneId, x, y, z, rotY}` | 进世界；`sceneId` 缺省 `main_1`；名字/性别**以存档为权威** |
| `player_move` | `{x, y, z, rotY}` | 位置上报，**客户端 10Hz 节流** |

### 2.3 成长

| `type` | `data` | 说明 |
|---|---|---|
| `breakthrough` | `{characterId, spiritPower}` | 突破上报（`spiritPower` = 突破前灵力） |
| `get_attributes` | `{characterId}` | 查询属性面板 |
| `meditation_start` | `{characterId}` | 开始打坐（服务端累计 **2/s**，聚灵阵 **×2**） |
| `meditation_stop` | `{characterId}` | 停止并结算（返回 `meditation_result` + `character_attributes`） |

### 2.4 战斗与法术

| `type` | `data` | 说明 |
|---|---|---|
| `combat_attack` | `{skill, targetId}` | 攻击；`skill: fireball/slash`；`targetId` = 目标 sessionId；**服务端权威结算** |
| `combat_resurrect` | `{}` | 请求复活（服务端回满并广播） |
| `cast_spell` | `{spellId, targetId?, text?}` | 施法；`impact` 需 `targetId`，`telepathy` 需 `targetId` + `text` |

### 2.5 物品与装备

| `type` | `data` | 说明 |
|---|---|---|
| `get_inventory` | `{characterId}` | 背包 / 装备栏 |
| `equip_item` | `{characterId, instanceId}` | 穿戴（同槽已有装备自动换下） |
| `unequip_item` | `{characterId, slot}` | 卸下回背包；`slot 1~5` = 法器/法袍/发冠/戒指/玉佩 |
| `use_item` | `{characterId, instanceId}` | 用丹药（回血/回灵，数量 -1；**境界不足拒绝**） |
| `enhance_item` | `{characterId, instanceId}` | 强化（消耗 1 强化石；按品质上限/成功率/降级/保底） |
| `discard_item` | `{characterId, instanceId, quantity?}` | 丢弃 → **世界掉落物**（无主 + 坐标 = 角色当前位置；**不广播显示**） |
| `claim_mail` | `{characterId, mailId}` | 领邮件附件入背包（**已领取拒绝**） |

### 2.6 储物

| `type` | `data` | 说明 |
|---|---|---|
| `storage_list` | `{characterId}` | 总览（贴身栏 + 已佩戴储物法宝 + 各空间内容） |
| `storage_store` | `{characterId, itemInstanceId, targetStorageInstanceId, quantity?}` | 存入；堆叠型按件；储物法宝 = 实例占 1 格；**嵌套限 2 层 / 防环** |
| `storage_take` | `{characterId, storageInstanceId, itemId, quantity?}` | 取出到贴身空间（按件计格，**12 格**限制） |
| `storage_transfer` | `{characterId, fromStorageInstanceId, toStorageInstanceId, itemId, quantity?}` | 两储物空间间转移 |

### 2.7 功法与任务

| `type` | `data` | 说明 |
|---|---|---|
| `get_techniques` | `{characterId}` | 功法列表 |
| `upgrade_technique` | `{characterId, techniqueId}` | 消耗灵力升级；**受境界上限约束** |
| `get_tasks` | `{characterId}` | 任务列表 |
| `accept_task` | `{characterId, taskId}` | 接取 |
| `claim_task` | `{characterId, taskId}` | 领奖（灵力 + 物品；**重复领取拒绝**） |

### 2.8 社交（聊天 / 好友）

| `type` | `data` | 说明 |
|---|---|---|
| `chat_send` | `{channel, text, targetName?}` | `world`=世界(跨场景) / `scene`=附近(同场景) / `private`=私聊(按角色名) |
| `chat_history` | `{channel}` | 拉频道历史（world / scene，**各 50 条**） |
| `friend_apply` | `{playerId, targetUsername}` | 按用户名申请；对方在线实时收 `friend_notify` |
| `friend_accept` | `{playerId, fromPlayerId}` | 同意 |
| `friend_reject` | `{playerId, fromPlayerId}` | 拒绝 |
| `friend_remove` | `{playerId, friendPlayerId}` | 删除（**双向删除**） |
| `friend_list` | `{playerId}` | 好友列表 + 待处理申请 |

---

## 3. 响应类型（服务端 → 客户端）

### 3.1 账号与角色

| `type` | `data` | 说明 |
|---|---|---|
| `pong` | `{}` | 心跳回包 |
| `login_ok` | `{playerId, username, token}` | `token` = 会话鉴权 |
| `login_fail` | `{message}` | 登录失败 |
| `register_ok` | `{playerId, username}` | 注册成功 |
| `register_fail` | `{message}` | 注册失败 |
| `characters` | `{playerId, characters:[...]}` | 角色列表 |
| `create_ok` | `{character:{...}}` | 建角成功 |
| `create_fail` | `{message}` | 建角失败 |
| `logout_ok` | `{}` | 退出确认（客户端据此回登录界面） |

### 3.2 世界与移动

| `type` | `data` | 说明 |
|---|---|---|
| `world_state` | `{players:[...]}` | 进世界后返回当前在线玩家（**不含自己**） |
| `world_enter_ok` | `{id, characterId}` | 进世界回执（`id` = **自身 sessionId**，用于判断战斗攻/受方） |
| `player_joined` | `{id, characterId, name, x, y, z, rotY}` | 有新玩家进入（广播） |
| `player_move` | `{id, x, y, z, rotY}` | 某玩家移动（广播；`id` = 对方 sessionId） |
| `player_left` | `{id}` | 某玩家离开（广播；**断线也自动广播**） |

### 3.3 成长与属性

| `type` | `data` | 说明 |
|---|---|---|
| `breakthrough_result` | `{success, chance, consumed, required, realmIndex, realmLevel, spiritPower}` | 突破结果（服务端权威） |
| `character_attributes` | 属性面板 + `equipment` 摘要 | 数值**已含装备词条** |
| `meditation_result` | `{characterId, gained, spiritPower, maxSpiritPower, meditating}` | 打坐结算 |

> `character_attributes` 内容：气血 / 物攻 / 法攻 / 物防 / 法防 / 神识 / 命中 / 闪避 / 会心 / 格挡 / 破防 **+ 8 系元素攻抗** + `equipment`（已穿戴摘要）。
> **字段语义与公式见 `data-contract.md` §6**（本契约不重复）。

### 3.4 战斗与法术

| `type` | `data` | 说明 |
|---|---|---|
| `combat_hit` | `{attackerId, attackerName, targetId, targetName, skill, damage, miss, isCrit, isBlock, multiplier, targetHp, targetMaxHp, attackerXinmo, attackerKuangzao, attackerDanDu}` | 战斗命中（**全员广播**） |
| `combat_death` | `{targetId, killerId}` | 目标陨落（广播） |
| `combat_resurrect` | `{id, hp, maxHp}` | 复活回满（广播） |
| `spell_effect` | `{spell, casterId, casterName, shield/heal/hp/maxHp?}` | 法术效果广播（护盾 / 治疗 / buff） |
| `spell_fail` | `{message}` | 施法失败（灵力不足 / 目标不存在…） |
| `chat_private` | `{fromId, fromName, text}` | 传音术私聊（**仅目标收到**） |
| `chat_private_sent` | `{toId, fromName, text}` | 传音回执（施法者） |

### 3.5 物品、功法、任务、社交

| `type` | `data` | 说明 |
|---|---|---|
| `inventory` | `{characterId, items:[...]}` | 背包 + 已穿戴（`slot>0` 为装备槽） |
| `enhance_result` | `{instanceId, itemId, name, quality, qualityName, enhanceMax, success, level, message, pity?, pityMax?}` | 强化结果（客户端据此刷新背包与属性面板） |
| `mail_claimed` | `{mailId, claimed}` | 邮件附件领取回执 |
| `drop_result` | `{count, items:[...]}` | 掉落结果（世界掉落物已落库：无主 + 坐标） |
| `storage` | `{characterId, body:{capacity,used}, storages:[...]}` | 储物总览 |
| `techniques` | `{characterId, techniques:[...]}` | 功法列表（`techniqueId/name/level/maxLevel/desc/cost/affixes`） |
| `tasks` | `{characterId, tasks:[...]}` | 任务列表（`status 0锁定1可接2进行3可领4已领` / `progress` / `targetValue` / 奖励） |
| `chat_message` | `{channel, fromId, fromName, text, time, targetId?}` | 聊天广播（world 全员 / scene 同场景 / private 仅目标；发送者私聊回执带 `toMe=true`） |
| `chat_messages` | `{channel, messages:[...]}` | 频道历史 |
| `chat_fail` | `{message}` | 聊天失败（发言过快 / 目标不在线 / 空消息 / 未知频道） |
| `friends` | `{playerId, friends:[...], requests:[...]}` | 好友列表（`friends: playerId/username/online/sceneId`；`requests: playerId/username`） |
| `friend_notify` | `{type, fromPlayerId, fromUsername}` | 好友实时通知（`type=apply` 申请 / `accept` 同意） |
| `error` | `{message}` | 通用错误 |

---

## 4. REST API（GM 后台 ↔ 服务端）

**前缀**：`/api`　|　**统一响应信封**：

```json
{ "code": 0, "message": "ok", "data": { ... } }
```

> `code != 0` 表示失败，`message` 为错误说明。

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | → `{playerId, token}` |
| GET | `/api/players` | 玩家列表 |
| GET | `/api/players/{id}/characters` | 玩家角色列表 |
| POST | `/api/characters` | 创建角色 |
| POST | `/api/mail` | 发邮件 `{playerId, title, content, itemId, itemCount}` |
| POST | `/api/mail/claim` | 领邮件附件 |
| GET | `/api/techniques` | 功法目录（8 部，含 `perLevel` 词条） |
| GET | `/api/characters/{id}/techniques` | 角色功法（GM 查看） |
| POST | `/api/techniques/upgrade` | GM 升级功法 |
| POST | `/api/characters/{id}/realm` | **GM 调试**：设角色境界（验收神通/功法解锁） |
| GET | `/api/tasks` | 任务目录 |
| GET | `/api/characters/{id}/tasks` | 角色任务（GM 查看） |
| POST | `/api/tasks/accept` · `/api/tasks/claim` | GM 接取 / 领奖 |
| GET | `/api/items` | 物品/装备目录（条目含 `qualityName/qualityColor`、`enhanceMax`、`stackMax`） |
| POST | `/api/items` | 新增物品定义（**全服即时生效**） |
| PUT | `/api/items/{itemId}` | 编辑（**`itemId` 不可改**） |
| DELETE | `/api/items/{itemId}` | 删除（**被背包/装备引用时拒绝**） |
| POST | `/api/items/give` | GM 发物品（装备逐件、丹药/材料堆叠） |
| DELETE | `/api/items/discard` → `/api/items/discard` | 丢弃 → 世界掉落物（REST 默认主城坐标） |
| GET | `/api/instances?page&size&itemId&owner&location&unowned&q` | **物品实例统一总览**（聚合贴身/穿戴[槽位]/储物空间/无主[场景+坐标]；分页 + 组合筛选；**有主只读**） |
| PUT | `/api/instances/{id}/position` | 无主物品设位置（**有主拒绝**） |
| DELETE | `/api/instances/{id}` | 删除无主物品（**有主拒绝**） |
| DELETE | `/api/drops` | GM 清空全部无主物品 |
| GET | `/api/characters/{id}/inventory` | 角色背包（GM 查看） |
| GET | `/api/stats` | `{players, characters, mails, online}`（`online` = 世界中在线人数；另含 `scenes` 分线统计） |

---

## 5. 关键对象结构

### 5.1 角色对象

```json
{
  "id": 1, "playerId": 1, "name": "云中子", "gender": 0,
  "realmIndex": 0, "realmLevel": 3,
  "spiritPower": 320.0,
  "roots": [
    { "rootType": 4, "purity": 88.0, "sortOrder": 0 },
    { "rootType": 0, "purity": 72.0, "sortOrder": 1 }
  ],
  "spiritualRootQuality": 3,
  "bodyTier": 1, "bodyName": "金罡灵体",
  "xinmo": 12.5, "kuangzao": 8.0, "danDu": 0.0,
  "shenshi": 19.0,
  "hp": 100.0, "maxHp": 100.0
}
```

**枚举**：全部**引用 `data-contract.md`**，本契约不重复定义。

| 字段 | 取值 | 权威处 |
|---|---|---|
| `rootType` | `0~7` = 金木水火土风雷冰 | `data-contract.md` §0 勘误一 |
| `realmIndex` | **`0~8`** = 炼气…渡劫 | `data-contract.md` §0 勘误二 |
| `realmLevel` | 炼气 `1~10`；其余 `1~4` = 初期/中期/后期/大圆满 | `data-contract.md` §4 |
| `spiritualRootQuality` | `0~6` | `data-contract.md` §3.1 |
| `bodyTier` | `0~3` | `data-contract.md` §3.1 |
| `roots[].sortOrder` | **`0` = 主灵根 = 纯度最高者** | `data-contract.md` §3.2 |

> ⚠️ **注意**：`spiritPower`（协议里的灵力）与 `data-contract` 的 `mp` 是同一资源。
> 字段名不统一 **`spiritPower` vs `mp`** —— **M1 须统一并落 ADR**（Go 重写是统一的最佳时机，Java 侧保留原样）。

### 5.2 世界玩家对象

```json
{ "id": "e822cc42-...", "characterId": 3, "name": "云中子", "gender": 0,
  "x": 0.0, "y": 1.0, "z": 0.0, "rotY": 0.0 }
```

> `id` = **服务端 WebSocket sessionId**，是本次世界的唯一身份。
> **客户端无需知道自己的 id**，只按收到的 `id` 创建 / 更新 / 移除远端玩家。

### 5.3 背包物品对象

```json
{
  "instanceId": 12, "itemId": "wp_qingfengjian", "name": "清风剑",
  "type": 0, "slot": 0, "defSlot": 1, "quantity": 1, "requiredRealm": 0,
  "desc": "以玄铁铸就的轻盈长剑，剑身清鸣如风。",
  "affixes": { "physAttack": 15, "attackSpeed": 5, "hit": 5 },
  "use": {}, "bound": false
}
```

> **`affixes` 的键名必须与属性面板键名逐字相同** —— 权威清单见 `data-contract.md` §7.2。
> 元素攻/抗用 `elemAtk0~7` / `elemRes0~7`（**下标即灵根枚举**）。
> 词条值为**品质倍率 × 强化加成后的生效值**。

---

## 6. 法术与技能

### 6.1 基础法术（10 种，`cast_spell`）

| `spellId` | 名称 | 类型 | 效果 |
|---|---|---|---|
| `shield` | 灵力护盾 | 防御 | 消耗灵力生成护盾，**受击先扣盾** |
| `impact` | 灵力冲击 | 攻击 | 远程法术伤害，与灵力/法攻挂钩 |
| `lightstep` | 轻身术 | 辅助 | 移速/闪避提升（buff 广播） |
| `detect` | 神识探查 | 辅助 | 探测周围（**占位**） |
| `control` | 御物术 | 通用 | 操控物品攻击（**占位**） |
| `spiritarray` | 聚灵阵 | 辅助 | 提升修炼速度（buff 广播；打坐 ×2） |
| `telepathy` | 传音术 | 辅助 | 私密传音给指定玩家 |
| `stealth` | 隐匿术 | 辅助 | 隐藏气息（**占位**） |
| `fasting` | 辟谷术 | 辅助 | 无需进食（**占位**） |
| `heal` | 基础疗伤术 | 治疗 | 回复生命（上限 = 最大生命） |

### 6.2 本命神通

ID 格式 **`inn_<root>_<tier>`**（如 `inn_huo_1` = 火系火球术）。
**仅主灵根可施放**；随境界解锁（炼气=0 / 筑基=1 / 金丹=3）。
完整规则见 `data-contract.md` §5.1。

### 6.3 功法

ID 格式 **`gong_<root>`**（`gong_jin` / `gong_mu` / `gong_shui` / `gong_huo` / `gong_tu` / `gong_feng` / `gong_lei` / `gong_bing`）。
详见 `data-contract.md` §5.2。

---

## 7. 客户端联机流程

```
登录界面 → login → login_ok → 角色选择 → list_characters / create_character → 进入游戏
  1. enter_world（带初始位置）→ 服务端回 world_state，并向他人广播 player_joined
  2. 客户端 10Hz 上报 player_move → 服务端广播给他人
  3. 收到 world_state / player_joined → 生成远端玩家（胶囊体 + 头顶名字）
     收到 player_move → 更新目标点做插值
     收到 player_left → 移除
  4. 断线时服务端自动广播 player_left
```

**突破闭环**：菜单修炼页 / 技能轮盘触发 → **本地即时结算** + `breakthrough` 上报 → `breakthrough_result` 同步服务端权威数据。

---

## 8. 待办（按里程碑补全 · 见 `docs/ROADMAP.md`）

- [ ] **统一 `spiritPower` / `mp` 命名**（§5.1 备注）→ 落 ADR
- [ ] 为每条消息补**字段类型与必填性**（当前多数仅有字段名）
- [ ] 补 `character_attributes` 的**完整字段清单**（当前只列了分组）
- [ ] 确认 `sceneId` 命名规范（与 `asset-ref-contract.md` §5.2 联动）
- [ ] 确认 REST 的错误码表（当前只有 `code != 0` 的约定）
- [ ] 核对「占位」法术（`detect` / `control` / `stealth` / `fasting`）在正式工程是否保留
- [ ] 评估 WebSocket 是否需**消息版本协商**（旧客户端兼容靠「未带 token 放行」，不是长久之计）
- [ ] **客户端段协议的分层差**（**M2 前须裁**）—— 本契约 §1 定 **WS + JSON**；上游《技术架构》**§3.2** 定客户端走 **TCP + UDP/KCP + Protobuf**（商业化期双通道）。
      判为「**分阶段**」（原型期务实选择 vs 目标形态）**而非冲突**，但**上游未写明这句过渡** → 须补。**不阻塞 M1**（M1 照 §1 走即可）。见 **ADR-0014** §附带。
