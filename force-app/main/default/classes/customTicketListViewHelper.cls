public with sharing class customTicketListViewHelper {
    
    @AuraEnabled(cacheable=True)
    public static List<Case> getTickets(){
        return [SELECT Id, CaseNumber, ContactId, AccountId, Priority, 
                account.name, contact.name, Status, CreatedDate, Subject
                FROM Case
                LIMIT 1000];
    }

    @AuraEnabled(cacheable=True)
    public static List<Case> searchTickets(String searchString){
        List<List<SObject>> tickets = [FIND :searchString IN ALL FIELDS RETURNING Case(CaseNumber, ContactId, AccountId, Priority, 
        account.name, contact.name, Status, CreatedDate, Subject)];

        return (List<Case>) tickets[0];
    }

    @AuraEnabled
    public static void editTickets(List<Id> ticketIds){
        if(ticketIds.size() > 0 ){
            delete [SELECT Id FROM Contact WHERE Id in: ticketIds];
        }
    }
}